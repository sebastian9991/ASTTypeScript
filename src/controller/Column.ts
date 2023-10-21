import {OPTIONS, QUERY} from "./Validate";
import {InsightResult} from "./IInsightFacade";
export default class Column {
	public idString: string;
	public columnedData: any;
	private columnKeys: any;
	constructor(idString: string) {
		this.idString = idString;
		this.columnedData = [];
	}

	/**
	 * @param query
	 * @param data
	 */
	public createResult(query: any, data: any): InsightResult[] {
		this.filterData(data, this.getColumns(query));
		this.appendIDString();
		this.simpleSort(query[QUERY.OPTIONS][OPTIONS.ORDER]);
		return this.columnedData;
	}

	/**
	 * @param query
	 */
	public getColumns(query: any): string[] {
		let keys: string[] = [];
		for(const element of query[QUERY.OPTIONS][OPTIONS.COLUMNS]) {
			keys.push(this.splitIDStringKey(element));
		}
		this.columnKeys = keys;
		return keys;
	}

	/**
	 * @param data
	 * @param columnKeys
	 */
	public filterData(data: any, columnKeys: string []): any {
		for(const obj of data) {
			this.columnedData.push(Object.fromEntries(Object.entries(obj)
				.filter(([key]) => this.includesColumnKeys(key, columnKeys))));
		}
	}

	/** https://stackoverflow.com/questions/4647817/javascript-object-rename-key
	 * @param InputedString
	 */
	public appendIDString() {
		for(const obj of this.columnedData) {
			for(const key of this.columnKeys) {
				let newkey = this.conCater(key);
				obj[newkey] = obj[key];
				delete obj[key];
			}
		}
	}

	/**
	 * @param key
	 * @param columnKeys
	 */
	private includesColumnKeys(key: string, columnKeys: string[]): boolean {
		for(const element of columnKeys) {
			if(key === element) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @param IDStringKey
	 */
	private splitIDStringKey(IDStringKey: string): string {
		let key: string = IDStringKey.split("_")[1];
		return key;
	}

	/**
	 * @param key
	 */
	private conCater(key: string): string {
		return this.idString.concat("_").concat(key);
	}

	private simpleSort(sortOnKey: string) {
		let arrayed = this.columnedData as [];
		arrayed.sort((obj1, obj2) => (obj1[sortOnKey] > obj2[sortOnKey]) ? 1 : -1);

	}
}
