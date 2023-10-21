import Section from "./Section";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import * as fs from "fs-extra";
import JSZip, {JSZipObject} from "jszip";
import {ChildNode, Document, Element, Node, TextNode} from "parse5";
import Room from "./Room";
import * as http from "http";

// let counter = 0;
export default class Helpers {
	public parseCourses(
		id: string,
		content: string,
		kind: InsightDatasetKind,
		addedDatasets: string[]
	): Promise<string[]> {
		let validSections: Section[] = [];

		let zip = new JSZip();
		return zip
			.loadAsync(content, {base64: true})
			.then((data) => {
				if (data.folder(/^courses/).length <= 0) {
					return Promise.reject(new InsightError("Folder named courses does not exist"));
				}

				return Promise.all(
					data.file(/^courses/).map((file) => {
						// return file.async("string").then((fileData) => this.processSections(validSections, fileData));
						return this.processFile(validSections, file);
					})
				);
			})
			.catch(() => {
				return Promise.reject(new InsightError("Not a zip file"));
			})
			.then(() => {
				if (validSections.length === 0) {
					return Promise.reject(new InsightError("No valid section found"));
				}

				this.writeData(validSections, id, kind);

				addedDatasets.push(id);
				let res = addedDatasets.map(function (s) {
					return s.replace(".json", "");
				});

				return Promise.resolve(res);
			});
	}

	public processFile(validSections: Section[], file: JSZipObject) {
		return file.async("string").then((fileData) => this.processSections(validSections, fileData));
	}

	public processSections(validSections: Section[], fileData: string): void {
		let fileJson;

		try {
			fileJson = JSON.parse(fileData);
		} catch (e) {
			// TODO: check if this is correct
			// console.log(e); // need to do something else here?
		}

		if (fileJson !== undefined && fileJson["result"] !== undefined) {
			fileJson = JSON.parse(fileData);
			let sections = fileJson["result"];
			for (const section of sections) {
				let dept: string | undefined = section["Subject"];
				let idSection: string | undefined = section["Course"];
				let avg: number | undefined = section["Avg"];
				let instr: string | undefined = section["Professor"];
				let title: string | undefined = section["Title"];
				let pass: number | undefined = section["Pass"];
				let fail: number | undefined = section["Fail"];
				let audit: number | undefined = section["Audit"];
				let uuid: string | undefined = section["id"].toString();
				let year: number | undefined = parseInt(section["Year"], 10);

				if (
					dept === undefined ||
					idSection === undefined ||
					avg === undefined ||
					instr === undefined ||
					title === undefined ||
					pass === undefined ||
					fail === undefined ||
					audit === undefined ||
					uuid === undefined ||
					year === undefined
				) {
					continue;
				}

				if (section["Section"] === "overall") {
					year = 1900;
				}

				let entry: Section = new Section(dept, idSection, avg, instr, title, pass, fail, audit, uuid, year);
				validSections.push(entry);
			}
		}
	}

	public writeData(validSections: Section[], id: string, kind: InsightDatasetKind): void {
		// TODO: check if this is correct
		if (kind === InsightDatasetKind.Courses) {
			let modelData = {
				Courses: validSections,
			};
			let outputData = JSON.stringify(modelData);
			fs.writeFileSync("./data/" + id + ".json", outputData);
		}
	}

	// public async processBuildings(tree: Node): Promise<void> {
	// 	let node = tree as Element;
	// 	if (node == null) {
	// 		return Promise.resolve();
	// 	}
	//
	// 	if (node.nodeName === "tr") {
	// 		// console.log("found a tr");
	// 		let entry = new Room(undefined, undefined, undefined, undefined, undefined,
	// 			undefined, undefined, undefined, undefined, undefined, undefined);
	// 		this.findTDShortName(node, "class", "views-field views-field-field-building-code", entry);
	// 		// console.log(entry.shortname);
	// 		this.findTDFullName(node, "class", "views-field views-field-title", entry);
	// 		// console.log(entry.fullname);
	// 		this.findTDAddress(node, "class", "views-field views-field-field-building-address", entry);
	// 		// console.log(entry.address);
	// 		let sourceURL = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team643/";
	// 		let url = sourceURL + entry.address?.split(" ").join("%20");
	// 		let [lat, lon] = await this.getGeoLocation(url, entry);
	// 		entry.lat = lat;
	// 		entry.lon = lon;
	// 		// console.log(entry.fullname + ": " + entry.lat);
	// 		// console.log(entry.fullname + ": " + entry.lon);
	//
	// 		if (entry.shortname === undefined || entry.fullname === undefined || entry.address === undefined ||
	// 			entry.lat === undefined || entry.lon === undefined) {
	// 			return Promise.resolve();
	// 		}
	// 		return Promise.resolve();
	// 	}
	//
	// 	if (node.childNodes == null) {
	// 		// don't iterate
	// 		return Promise.resolve();
	// 	}
	//
	// 	let numChildNodes = node.childNodes.length;
	//
	// 	let test = [];
	// 	for (let i = 0; i < numChildNodes - 1; i++) {
	// 		test.push(this.processBuildings(node.childNodes[i] as Element));
	// 	}
	//
	// 	await Promise.all(test);
	//
	// 	await this.processBuildings(node.childNodes[numChildNodes - 1] as Element);
	// }
	//
	// public findTDFullName(tree: Node, name: string, value: string, room: Room): void {
	// 	let node = tree as Element;
	//
	// 	if (node == null) {
	// 		// TODO
	// 		return;
	// 	}
	//
	// 	if (node.nodeName === "td" && node.attrs[0].name === name && node.attrs[0].value === value) {
	// 		let subTargetNode = node.childNodes[1] as Element;
	// 		let targetFullName = subTargetNode.childNodes[0] as TextNode;
	// 		room.fullname = targetFullName.value;
	// 		return;
	// 	}
	//
	// 	if (node.childNodes == null) {
	// 		// don't iterate
	// 		// TODO
	// 		return;
	// 	}
	//
	// 	let numChildNodes = node.childNodes.length;
	//
	// 	for (let i = 0; i < numChildNodes - 1; i++) {
	// 		this.findTDFullName(node.childNodes[i] as Element, name, value, room);
	// 	}
	//
	// 	this.findTDFullName(node.childNodes[numChildNodes - 1] as Element, name, value, room);
	// }
	//
	// public findTDShortName(tree: Node, name: string, value: string, room: Room): void {
	// 	let node = tree as Element;
	//
	// 	if (node == null) {
	// 		// TODO
	// 		return;
	// 	}
	//
	// 	if (node.nodeName === "td" && node.attrs[0].name === name && node.attrs[0].value === value) {
	// 		let targetShortName = node.childNodes[0] as TextNode;
	// 		room.shortname = targetShortName.value.replace("\n", "").trim();
	// 		return;
	// 	}
	//
	// 	if (node.childNodes == null) {
	// 		// don't iterate
	// 		// TODO
	// 		return;
	// 	}
	//
	// 	let numChildNodes = node.childNodes.length;
	//
	// 	for (let i = 0; i < numChildNodes - 1; i++) {
	// 		this.findTDShortName(node.childNodes[i] as Element, name, value, room);
	// 	}
	//
	// 	this.findTDShortName(node.childNodes[numChildNodes - 1] as Element, name, value, room);
	// }
	//
	// public findTDAddress(tree: Node, name: string, value: string, room: Room): void {
	// 	let node = tree as Element;
	//
	// 	if (node == null) {
	// 		// TODO
	// 		return;
	// 	}
	//
	// 	if (node.nodeName === "td" && node.attrs[0].name === name && node.attrs[0].value === value) {
	// 		let targetAddress = node.childNodes[0] as TextNode;
	// 		room.address = targetAddress.value.trim();
	// 		return;
	// 	}
	//
	// 	if (node.childNodes == null) {
	// 		// don't iterate
	// 		// TODO
	// 		return;
	// 	}
	//
	// 	let numChildNodes = node.childNodes.length;
	//
	// 	for (let i = 0; i < numChildNodes - 1; i++) {
	// 		this.findTDAddress(node.childNodes[i] as Element, name, value, room);
	// 	}
	//
	// 	this.findTDAddress(node.childNodes[numChildNodes - 1] as Element, name, value, room);
	// }
	//
	// public async getGeoLocation(url: string, room: Room): Promise<[number, number]> {
	// 	let lat = 0;
	// 	let lon = 0;
	// 	return new Promise(function (resolve, reject) {
	// 		http.get(url, (res) => {
	// 			res.setEncoding("utf8");
	// 			let data = "";
	// 			res.on("data", (info) => {
	// 				data += info;
	// 			});
	//
	// 			res.on("end", () => {
	// 				try {
	// 					let parsedData = JSON.parse(data);
	// 					lat = parsedData["lat"];
	// 					lon = parsedData["lon"];
	// 					resolve([lat, lon]);
	// 				} catch (e) {
	// 					reject(undefined);
	// 				}
	// 			});
	// 		})
	// 			.on("error", (e) => {
	// 				reject(undefined);
	// 			});
	// 	});
	// }
	//
	// // public getCounter(): void {
	// // 	console.log(counter);
	// // }
}
