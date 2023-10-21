import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	ResultTooLargeError,
	NotFoundError
} from "./IInsightFacade";
import Validate, {LOGIC, MCOMPARATOR, mfields, OPTIONS, QUERY, SCOMPARISON, sfields} from "./Validate";
import LogicalTree from "./LogicalTree";
import Solver from "./Solver";
import Column from "./Column";

import * as fs from "fs-extra";
import Helpers from "./Helpers";
import JSZip from "jszip";
import {Element, parse} from "parse5";
import RoomsHelpers from "./roomsHelpers";
import Room from "./Room";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
let validator: Validate;
let solver: Solver;
let columnizer: Column;
let queriedData: any = [];
export default class InsightFacade implements IInsightFacade {
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}

	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (!fs.existsSync("./data")) {
			fs.mkdirSync("./data");
		}

		let addedDatasets: string[] = fs.readdirSync("./data");

		if (id.includes("_") || id.trim().length === 0 || addedDatasets.includes(id + ".json")) {
			return Promise.reject(new InsightError("Invalid id name: underscore or only whitespaces or already added"));
		}

		let h: Helpers = new Helpers();
		let rh: RoomsHelpers = new RoomsHelpers();

		if (kind === InsightDatasetKind.Courses) {
			return h.parseCourses(id, content, kind, addedDatasets);
		}

		if (kind === InsightDatasetKind.Rooms) {
			return rh.parseBuildings(id, content, kind, addedDatasets);
		}

		return Promise.reject(new InsightError("Invalid kind"));
	}

	public removeDataset(id: string): Promise<string> {
		if (id.includes("_") || id.trim().length === 0) {
			return Promise.reject(new InsightError("Invalid id name: underscore or only whitespaces"));
		}

		if (!fs.existsSync("./data")) {
			return Promise.reject(new NotFoundError("Dataset with this id has not been added"));
		}

		let addedDatasets: string[] = fs.readdirSync("./data");

		if (!addedDatasets.includes(id + ".json")) {
			return Promise.reject(new NotFoundError("Dataset with this id has not been added"));
		}

		fs.removeSync("./data/" + id + ".json");

		return Promise.resolve(id);
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		let resolutionData: InsightResult[] = [];
		validator = new Validate();
		let addedDataSetIDs: string[] = validator.mapRemoveJSONAddedDataSet(fs.readdirSync("./data"));
		try{
			validator.isValidQuery(query);
			if(!validator.matchIDStringQueryToAddedDataSet(validator.idStringsStored[0], addedDataSetIDs)) {
				throw new InsightError();
			}
			let data = fs.readFileSync("./data/" + validator.idStringsStored[0].concat(".json"), "utf8");
			let jsonData = JSON.parse(data);
			let logicalTree: LogicalTree = new LogicalTree();
			solver = new Solver(jsonData);
			this.queryDataset(query, logicalTree);
			columnizer = new Column(validator.idStringsStored[0]);
			resolutionData = columnizer.createResult(query,queriedData);
		} catch(error){
			return Promise.reject(error);
		}
		return Promise.resolve(resolutionData);
	}

	public listDatasets(): Promise<InsightDataset[]> {
		if (!fs.existsSync("./data")) {
			return Promise.resolve([]);
		}

		let addedDatasets: string[] = fs.readdirSync("./data");
		let res: InsightDataset[] = [];

		for (const dataset of addedDatasets) {
			let insightDatasetObject: InsightDataset = {
				id: "",
				kind: InsightDatasetKind.Rooms,
				numRows: 0,
			};

			insightDatasetObject.id = dataset.replace(".json", "");
			let data = fs.readFileSync("./data/" + dataset, "utf8");
			let jsonData = JSON.parse(data);

			// TODO: check if this is correct
			if (Object.keys(jsonData)[0] === "Courses") {
				insightDatasetObject.kind = InsightDatasetKind.Courses;
				insightDatasetObject.numRows = jsonData["Courses"].length;
			} else {
				insightDatasetObject.numRows = jsonData["Rooms"].length;
			}

			res.push(insightDatasetObject);
		}

		return Promise.resolve(res);
	}

	/**
	 *
	 * @param query The query that is validated
	 * @param data The data read from the ./data folder of specific ID matching the query datasetID not indexed into "COURSES"
	 */
	private queryDataset(query: any, logicalTree: LogicalTree): any {
		logicalTree.formatQuery(query);
		queriedData = solver.solve(logicalTree.tree, false);
		if(queriedData.length > 5000) {
			throw new ResultTooLargeError();
		}
	}
}
