import {Element, Node, TextNode} from "parse5";
import Room from "./Room";
import http from "http";

export default class RoomsUtils {
	public findTDShortName(tree: Node, name: string, value: string, room: Room): void {
		let node = tree as Element;

		if (node == null) {
			return;
		}

		if (node.nodeName === "td" && node.attrs[0].name === name && node.attrs[0].value === value) {
			let targetShortName = node.childNodes[0] as TextNode;
			room.shortname = targetShortName.value.replace("\n", "").trim();
			return;
		}

		if (node.childNodes == null) {
			return;
		}

		let numChildNodes = node.childNodes.length;

		for (let i = 0; i < numChildNodes - 1; i++) {
			this.findTDShortName(node.childNodes[i] as Element, name, value, room);
		}

		this.findTDShortName(node.childNodes[numChildNodes - 1] as Element, name, value, room);
	}

	public findTDAddress(tree: Node, name: string, value: string, room: Room): void {
		let node = tree as Element;

		if (node == null) {
			return;
		}

		if (node.nodeName === "td" && node.attrs[0].name === name && node.attrs[0].value === value) {
			let targetAddress = node.childNodes[0] as TextNode;
			room.address = targetAddress.value.trim();
			return;
		}

		if (node.childNodes == null) {
			return;
		}

		let numChildNodes = node.childNodes.length;

		for (let i = 0; i < numChildNodes - 1; i++) {
			this.findTDAddress(node.childNodes[i] as Element, name, value, room);
		}

		this.findTDAddress(node.childNodes[numChildNodes - 1] as Element, name, value, room);
	}

	public async getGeoLocation(url: string, room: Room): Promise<[number, number]> {
		let lat = 0;
		let lon = 0;
		return new Promise(function (resolve, reject) {
			http.get(url, (res) => {
				res.setEncoding("utf8");
				let data = "";
				res.on("data", (info) => {
					data += info;
				});

				res.on("end", () => {
					try {
						let parsedData = JSON.parse(data);
						lat = parsedData["lat"];
						lon = parsedData["lon"];
						resolve([lat, lon]);
					} catch (e) {
						reject(undefined);
					}
				});
			})
				.on("error", (e) => {
					reject(undefined);
				});
		});
	}
}
