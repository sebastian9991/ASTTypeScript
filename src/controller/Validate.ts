import {InsightError} from "./IInsightFacade";
export let mfields = ["avg", "pass", "fail", "audit", "audit", "year"];
export let sfields = ["dept", "id", "instructor", "title", "uuid"];
export enum MCOMPARATOR {
	LT = "LT",
	GT = "GT",
	EQ = "EQ"
}
export enum SCOMPARISON {
	IS = "IS"
}
export enum LOGIC {
	AND = "AND",
	OR = "OR",
	NOT = "NOT"
}
export enum QUERY {
	WHERE = "WHERE",
	OPTIONS = "OPTIONS"
}
export enum OPTIONS {
	COLUMNS = "COLUMNS",
	ORDER = "ORDER"
}
export default class Validate {
	public idStringsStored: string[];
	constructor() {
		this.idStringsStored = [];
	}

	/**
	 * @param query The query that is inputted to validated
	 * EFFECTS: Checks to see if the query is valid according to the given EBNF
	 */
	public isValidQuery(query: any): boolean {
		if(query[QUERY.WHERE] !== undefined && query[QUERY.OPTIONS] !== undefined) {
			if(this.checkLOGICCOMP(query[QUERY.WHERE])) {
				this.loopFilter(query[QUERY.WHERE]); // RECURSE on the loop filter
			} else if (this.checkMCOMP(query[QUERY.WHERE])) {
				for (const mcomparatorEnumElement in MCOMPARATOR) {
					if (query[QUERY.WHERE][mcomparatorEnumElement] !== undefined) {
						this.getObjectKeyAndValue(query[QUERY.WHERE][mcomparatorEnumElement], true);
						break;
					}
				}
			} else if (this.checkSCOMP(query[QUERY.WHERE])) {
				this.getObjectKeyAndValue(query[QUERY.WHERE][SCOMPARISON.IS], false);
			}
			if(query[QUERY.OPTIONS] !== undefined && !this.objectIsEmpty(query[QUERY.OPTIONS])) {
				this.validateOPTIONS(query[QUERY.OPTIONS]);
			} else {
				throw new InsightError();
			}
			this.validateAllDatasetIDs(this.idStringsStored);
			return true;
		}
		throw new InsightError();
	}

	/**
	 * We must input the query only with the array indexed to the WHERE
	 * Terminates on a MCOMPARISON or SCOMPARISON filter.
	 * @param query query that is indexed with WHERE and has a logical comparator
	 * @throws InsightResult if the size of the array is one or zero
	 */
	public loopFilter(query: any): boolean {
		for(const logicEnumElement in LOGIC) {
			if(query[logicEnumElement] !== undefined) {
				if(logicEnumElement === LOGIC.NOT) {
					let queryNOT: any = query[LOGIC.NOT];
					if(this.checkLOGICCOMP(queryNOT)) {
						this.loopFilter(queryNOT);
					} else if(this.checkMCOMP(queryNOT)) {
						for(const mcomparatorEnumElement in MCOMPARATOR) {
							if(queryNOT[mcomparatorEnumElement] !== undefined) {
								this.getObjectKeyAndValue(queryNOT[mcomparatorEnumElement], true);
								break;
							}
						}
					} else if(this.checkSCOMP(queryNOT)) {
						this.getObjectKeyAndValue(queryNOT[SCOMPARISON.IS], false);
						return true;
					} else {
						throw new InsightError();
					}
					return true;
				}
				if (query[logicEnumElement].length <= 0) {
					throw new InsightError();
				}
				for (const element of query[logicEnumElement]) {
					if (this.checkLOGICCOMP(element)) {
						this.loopFilter(element);
					} else if (this.checkMCOMP(element)) {
						for (const mcomparatorEnumElement in MCOMPARATOR) {
							if (element[mcomparatorEnumElement] !== undefined) {
								this.getObjectKeyAndValue(element[mcomparatorEnumElement], true);
								break;
							}
						}
					} else if (this.checkSCOMP(element)) {
						this.getObjectKeyAndValue(element[SCOMPARISON.IS], false);
					} else {
						throw new InsightError(); // This will catch empty clauses
					}
				}
			}
		}
		return true;
	}

	/**
	 * @param obj The object to get the object key from. Usually only size of 1.
	 * @param isCalledByMCOMPARATOR A boolean value representing on a branch to go to check mfield or sfield
	 */
	public getObjectKeyAndValue(obj: any, isCalledByMCOMPARATOR: boolean): boolean {
		if(Object.keys(obj)[0] === undefined){
			throw new InsightError();
		}
		let splitStringArray = Object.keys(obj)[0].split("_");
		let objectValuePair = Object.values(obj)[0];
		let courseId = splitStringArray[0];
		let keyField = splitStringArray[1];
		this.validateIDString(courseId);
		if(isCalledByMCOMPARATOR) {
			this.validateMfield(keyField, objectValuePair);
		} else {
			this.validateSfield(keyField, objectValuePair);
		}
		return true;
	}

	/**
	 * @param str string of the object key idstring
	 * @throws InsightError when the idstring includes an underscore (according to the EBNF).
	 */
	public validateIDString(str: string): boolean {
		if(str.includes("_")) {
			throw new InsightError();
		}
		this.idStringsStored.push(str);
		return true;
	}

	/**
	 * @param str The string to check if a valid mfield
	 * @throws InsightError If typeof value is not of number
	 */
	public validateMfield(str: string, value: any): boolean{
		if(typeof value !== "number") {
			throw new InsightError();
		}
		for(const element of mfields) {
			if(str === element) {
				return true;
			}
		}
		throw new InsightError();
	}


	public validateSfield(str: string, value: any): boolean {
		if(typeof value !== "string" || !this.validRegex(value)) {
			throw new InsightError();
		}
		for(const element of sfields) {
			if(str === element) {
				return true;
			}
		}
		throw new InsightError();
	}


	public validateSfieldAndMfield(str: string): boolean {
		for(const element of sfields){
			if(str === element) {
				return true;
			}
		}
		for(const element of mfields) {
			if(str === element) {
				return true;
			}
		}
		throw new InsightError();
	}

	/**
	 * @param query The original input query is expected. No other indexing is allowed.
	 */
	public validateOPTIONS(query: any): boolean {
		let fieldsINColumn: string[] = [];
		if (query[OPTIONS.COLUMNS].length <= 0) {
			throw new InsightError();
		}
		for (const element of query[OPTIONS.COLUMNS]) {
			if (typeof element !== "string") {
				throw new InsightError();
			}
			let stringSplitArrayCOLOUMNS = element.split("_");
			this.validateIDString(stringSplitArrayCOLOUMNS[0]);
			this.validateSfieldAndMfield(stringSplitArrayCOLOUMNS[1]);
			fieldsINColumn.push(stringSplitArrayCOLOUMNS[1]);
		}
		if (query[OPTIONS.ORDER] !== undefined) {
			let stringSplitArrayORDER = query[OPTIONS.ORDER].split("_");
			this.validateIDString(stringSplitArrayORDER[0]);
			for (const element of fieldsINColumn) {
				if (stringSplitArrayORDER[1] === element) {
					return true;
				}
			}
			throw new InsightError();
		}
		return true;
	}


	public checkMCOMP(query: any): boolean {
		if(query[MCOMPARATOR.GT] !== undefined) {
			return true;
		} else if(query[MCOMPARATOR.EQ] !== undefined) {
			return true;
		} else if(query[MCOMPARATOR.LT] !== undefined) {
			return true;
		} else {
			return false;
		}
	}


	public checkLOGICCOMP(query: any): boolean {
		if(query[LOGIC.OR] !== undefined) {
			return true;
		} else if (query[LOGIC.AND] !== undefined) {
			return true;
		} else if(query[LOGIC.NOT] !== undefined){
			return true;
		} else {
			return false;
		}
	}

	public checkSCOMP(query: any): boolean {
		if(query[SCOMPARISON.IS] !== undefined) {
			return true;
		} else {
			return false;
		}
	}

	public mapRemoveJSONAddedDataSet(addedDataSets: string[]): string[] {
		let res = addedDataSets.map(function (s) {
			return s.replace(".json", "");
		});
		return res;
	}

	public matchIDStringQueryToAddedDataSet(idString: string, addedIDString: string []): boolean {
		for(const element of addedIDString) {
			if(idString === element) {
				return true;
			}
		}
		return false;
	}

	public validateAllDatasetIDs(dataSetIDArray: string[]): boolean {
		let IDCheck: string = dataSetIDArray[0];
		for(const elements of dataSetIDArray) {
			if(IDCheck !== elements) {
				throw new InsightError();
			}
		}
		return true;
	}

	private validRegex(inputString: string): boolean {
		if((inputString.match(/\*/g) || []).length > 2) {
			return false;
		}
		if(inputString.charAt(0) === "*" && inputString.charAt(inputString.length - 1) === "*") {
			return true;
		} else if(inputString.charAt(0) === "*") {
			return true;
		} else if(inputString.charAt(inputString.length - 1) === "*") {
			return true;
		} else if(!inputString.includes("*")) {
			return true;
		} else {
			return false;
		}
	}

	public objectIsEmpty(obj: any) {
		return Object.keys(obj).length === 0;
	}
}
