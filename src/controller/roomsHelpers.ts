import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as fs from "fs-extra";
import JSZip, {JSZipObject} from "jszip";
import {ChildNode, Document, Element, Node, parse, TextNode} from "parse5";
import Room from "./Room";
import * as http from "http";
import RoomsUtils from "./RoomsUtils";

export default class RoomsHelpers {
	public parseBuildings(id: string, content: string, kind: InsightDatasetKind, addedDatasets: string[]) {
		let validRooms: Room[] = [];
		let zip = new JSZip();
		return zip
			.loadAsync(content, {base64: true})
			.then((data) => {
				if (data.folder(/^rooms/).length <= 0) {
					return Promise.reject(new InsightError("Folder named rooms does not exist"));
				}

				let target = new RegExp("^rooms/index.htm", "g");
				if (data.file(target).length > 1) {
					return Promise.reject(new InsightError("Not a valid zip file"));
				}

				return Promise.all(
					data.file(/index.htm/).map((file) => {
						return this.processFile(validRooms, file, data);
					})
				);
				return Promise.resolve([]);

			})
			.catch((err) => {
				// console.log(err);
				return Promise.reject(new InsightError("Not a zip file"));
			})
			.then(() => {
				if (validRooms.length === 0) {
					return Promise.reject(new InsightError("No valid section found"));
				}

				let modelData = {
					Rooms: validRooms,
				};
				let outputData = JSON.stringify(modelData);
				fs.writeFileSync("./data/" + id + ".json", outputData);

				addedDatasets.push(id);
				let res = addedDatasets.map(function (s) {
					return s.replace(".json", "");
				});

				return Promise.resolve(res);
			});
	}

	public processFile(validRooms: Room[], file: JSZipObject, data: JSZip) {
		return file.async("string").then((fileData) => this.processBuildings(parse(fileData), data, validRooms));
	}

	public async processBuildings(tree: Node, data: JSZip, validRooms: Room[]): Promise<void> {
		let node = tree as Element;
		if (node == null) {
			return Promise.resolve();
		}

		if (node.nodeName === "tr") {
			let entry = new Room(undefined, undefined, undefined, undefined, undefined,
				undefined, undefined, undefined, undefined, undefined, undefined);

			let h: RoomsUtils = new RoomsUtils();
			h.findTDShortName(node, "class", "views-field views-field-field-building-code", entry);
			this.findTDFullName(node, "class", "views-field views-field-title", entry);
			h.findTDAddress(node, "class", "views-field views-field-field-building-address", entry);

			let sourceURL = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team643/";
			let url = sourceURL + entry.address?.split(" ").join("%20");
			let [lat, lon] = await h.getGeoLocation(url, entry);
			entry.lat = lat;
			entry.lon = lon;

			if (entry.shortname === undefined || entry.fullname === undefined || entry.address === undefined ||
				entry.lat === undefined || entry.lon === undefined) {
				return Promise.resolve();
			}

			if (entry.href !== undefined) {
				await this.parseRooms(entry.href, data, entry, validRooms);
				return Promise.resolve();
			}


			return Promise.resolve();
		}

		if (node.childNodes == null) {
			return Promise.resolve();
		}

		let numChildNodes = node.childNodes.length;

		let test = [];
		for (let i = 0; i < numChildNodes - 1; i++) {
			test.push(this.processBuildings(node.childNodes[i] as Element, data, validRooms));
		}

		await Promise.all(test);

		await this.processBuildings(node.childNodes[numChildNodes - 1] as Element, data, validRooms);
	}

	public parseRooms(href: string, data: JSZip, room: Room, validRooms: Room[]) {
		let targetFile = new RegExp(href, "g");
		return Promise.all(
			data.file(targetFile).map((file) => {
				return file.async("string")
					.then((fileData) => {
						let tree = parse(fileData);
						this.processRooms(tree, room, validRooms);
					});
			})
		);
	}

	public processRooms(tree: Node, room: Room, validRooms: Room[]) {
		let node = tree as Element;
		if (node == null) {
			return;
		}

		if (node.nodeName === "tr") {
			this.findTDNumber(node, "class", "views-field views-field-field-room-number", room);
			this.findTDSeats(node, "class", "views-field views-field-field-room-capacity", room);
			this.findTDFurniture(node, "class", "views-field views-field-field-room-furniture", room);
			this.findTDType(node, "class", "views-field views-field-field-room-type", room);

			if (room.number === undefined || room.seats === undefined || room.furniture === undefined ||
				room.type === undefined || room.href === undefined) {
				return;
			}

			let entry = JSON.parse(JSON.stringify(room));
			validRooms.push(entry);
			return;
		}

		if (node.childNodes == null) {
			return;
		}

		let numChildNodes = node.childNodes.length;

		for (let i = 0; i < numChildNodes - 1; i++) {
			this.processRooms(node.childNodes[i] as Element, room, validRooms);
		}

		this.processRooms(node.childNodes[numChildNodes - 1] as Element, room, validRooms);
	}

	public findTDType(tree: Node, name: string, value: string, room: Room) {
		let node = tree as Element;

		if (node == null) {
			return;
		}

		if (node.nodeName === "td" && node.attrs[0].name === name && node.attrs[0].value === value) {
			let targetSeats = node.childNodes[0] as TextNode;
			room.type = targetSeats.value.trim();
			return;
		}

		if (node.childNodes == null) {
			return;
		}

		let numChildNodes = node.childNodes.length;

		for (let i = 0; i < numChildNodes - 1; i++) {
			this.findTDType(node.childNodes[i] as Element, name, value, room);
		}

		this.findTDType(node.childNodes[numChildNodes - 1] as Element, name, value, room);
	}

	public findTDFurniture(tree: Node, name: string, value: string, room: Room) {
		let node = tree as Element;

		if (node == null) {
			return;
		}

		if (node.nodeName === "td" && node.attrs[0].name === name && node.attrs[0].value === value) {
			let targetSeats = node.childNodes[0] as TextNode;
			room.furniture = targetSeats.value.trim();
			return;
		}

		if (node.childNodes == null) {
			return;
		}

		let numChildNodes = node.childNodes.length;

		for (let i = 0; i < numChildNodes - 1; i++) {
			this.findTDFurniture(node.childNodes[i] as Element, name, value, room);
		}

		this.findTDFurniture(node.childNodes[numChildNodes - 1] as Element, name, value, room);
	}

	public findTDSeats(tree: Node, name: string, value: string, room: Room) {
		let node = tree as Element;

		if (node == null) {
			return;
		}

		if (node.nodeName === "td" && node.attrs[0].name === name && node.attrs[0].value === value) {
			let targetSeats = node.childNodes[0] as TextNode;
			room.seats = parseInt(targetSeats.value.trim(),10);
			return;
		}

		if (node.childNodes == null) {
			return;
		}

		let numChildNodes = node.childNodes.length;

		for (let i = 0; i < numChildNodes - 1; i++) {
			this.findTDSeats(node.childNodes[i] as Element, name, value, room);
		}

		this.findTDSeats(node.childNodes[numChildNodes - 1] as Element, name, value, room);
	}

	public findTDNumber(tree: Node, name: string, value: string, room: Room) {
		let node = tree as Element;

		if (node == null) {
			return;
		}

		if (node.nodeName === "td" && node.attrs[0].name === name && node.attrs[0].value === value) {
			let subTargetNode = node.childNodes[1] as Element;
			let targetNumber = subTargetNode.childNodes[0] as TextNode;
			room.number = targetNumber.value;
			room.href = subTargetNode.attrs[0].value;
			return;
		}

		if (node.childNodes == null) {
			return;
		}

		let numChildNodes = node.childNodes.length;

		for (let i = 0; i < numChildNodes - 1; i++) {
			this.findTDNumber(node.childNodes[i] as Element, name, value, room);
		}

		this.findTDNumber(node.childNodes[numChildNodes - 1] as Element, name, value, room);
	}

	public findTDFullName(tree: Node, name: string, value: string, room: Room): void {
		let node = tree as Element;

		if (node == null) {
			// TODO
			return;
		}

		if (node.nodeName === "td" && node.attrs[0].name === name && node.attrs[0].value === value) {
			let subTargetNode = node.childNodes[1] as Element;
			let targetFullName = subTargetNode.childNodes[0] as TextNode;
			room.fullname = targetFullName.value;
			room.href = subTargetNode.attrs[0].value;
			return;
		}

		if (node.childNodes == null) {
			return;
		}

		let numChildNodes = node.childNodes.length;

		for (let i = 0; i < numChildNodes - 1; i++) {
			this.findTDFullName(node.childNodes[i] as Element, name, value, room);
		}

		this.findTDFullName(node.childNodes[numChildNodes - 1] as Element, name, value, room);
	}
}
