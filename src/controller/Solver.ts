import {LOGIC, MCOMPARATOR, SCOMPARISON} from "./Validate";
import {Node} from "./LogicalTree";
import Set from "./Set";
interface Operand {
	comparator: string,
	field: string,
	value: string | number
}
interface Operator {
	logic: string,
}
enum DataType {
	COURSES = "Courses",
	ROOMS = "Rooms"
}
let setter: Set = new Set();
export default class Solver {
	public data: [];
	constructor(data: any) {
		this.data = data[DataType.COURSES] as [];
	}

	/**
	 * https://www.geeksforgeeks.org/expression-tree/
	 * @param tree The tree that is created from a validated query
	 * EFFECTS:
	 */
	public solve(treeInput: Node<Operand | Operator>, recurse: boolean): any{
		let operandList: Array<(Operand | Operator | null)> = [];
		if(treeInput.children === null || treeInput.children.length === 0 && recurse === true) {
			// TODO: Then it is a operand leaf
			return treeInput.value;
		} else if(treeInput.children === null || treeInput.children.length === 0 && recurse === false) {
			let singleton = treeInput.value as (Operator | Operand | null);
			operandList.push(singleton);
			return this.calculate(operandList, null);
		} else {
			for(const element of treeInput.children) {
				let A: any = this.solve(element, true);
				operandList.push(A);
			}
			// TODO: RETURN A DATASET OR OPERAND
			return this.calculate(operandList, treeInput.value);
		}
		return null;
	}

	/**
	 * EFFECTS: filters the data global variable
	 */
	public calculate(operandList: Array<(Operator | Operand | null)>, operation: Operator | Operand | null): any {
		let operationOperator = operation as Operator;
		if(operationOperator === null) {
			// TODO: Singleton calculation assume no set action
			return this.filterAND(operandList);
		} else if(operationOperator.logic === LOGIC.AND) {
			return this.filterAND(operandList);
		} else if (operationOperator.logic === LOGIC.OR) {
			return this.filterOR(operandList);
		} else if (operationOperator.logic === LOGIC.NOT) {
			// TODO: assume that the not filter has one child, thus one in the operand list
			// TODO: Either a set or a comparator
			return this.filterNOT(operandList);
		}
		return null;
	}

	private filterNOT(operandList: Array<Operator | Operand | null>) {
		let iteratorCount: number = this.data.length;
		let setNot: any = [];
		if (Array.isArray(operandList[0])) {
			let negatedData = Object.assign([], this.data);
			let setData: any = operandList[0] as any;
			return negatedData.filter((x) => !setData.includes(x));
		} else {
			let operand: Operand = operandList[0] as Operand;
			while (iteratorCount--) {
				let keepSection: boolean = false;
				let objectSection: any = this.data[iteratorCount];
				if (operand.comparator === MCOMPARATOR.LT) {
					if (objectSection[operand.field] >= operand.value) {
						keepSection = true;
					}

				} else if (operand.comparator === MCOMPARATOR.EQ) {
					if (objectSection[operand.field] !== operand.value) {
						keepSection = true;
					}

				} else if (operand.comparator === MCOMPARATOR.GT) {
					if (objectSection[operand.field] <= operand.value) {
						keepSection = true;
					}
				} else if (operand.comparator === SCOMPARISON.IS) {
					let stringReg: string = operand.value as string;
					let regExp = new RegExp(this.regexString(stringReg));
					if (!regExp.test(objectSection[operand.field])) {
						keepSection = true;
					}

				}
				if(keepSection) {
					setNot.push(objectSection);
				}
			}
		}
		return setNot;
	}

	private filterOR(operandList: Array<Operator | Operand | null>) {
		let iteratorCount: number = this.data.length;
		let set: any = [];
		for(const element of operandList) {
			if(Array.isArray(element)) {
				// TODO: Set OR unionize the arrays
				set = setter.setUnion(set, element);
			}
		}
		while (iteratorCount--) {
			let keepSection: boolean = false;
			let objectSection: any = this.data[iteratorCount];
			for (const element of operandList) {
				if(Array.isArray(element) || element === null) {
					continue;
				}
				let elementOperand = element as Operand;
				if (elementOperand.comparator === MCOMPARATOR.GT) {
					if (objectSection[elementOperand.field] > elementOperand.value) {
						keepSection = true;
						break;
					}
				} else if (elementOperand.comparator === MCOMPARATOR.LT) {
					if (objectSection[elementOperand.field] < elementOperand.value) {
						keepSection = true;
						break;
					}
				} else if (elementOperand.comparator === MCOMPARATOR.EQ) {
					if (objectSection[elementOperand.field] === elementOperand.value) {
						keepSection = true;
						break;
					}
				} else if (elementOperand.comparator === SCOMPARISON.IS) {
					let stringReg: string = elementOperand.value as string;
					let regExp = new RegExp(this.regexString(stringReg));
					if (regExp.test(objectSection[elementOperand.field])) {
						keepSection = true;
						break;
					}
				}
			}
			// TODO: Remove the section
			if (keepSection) {
				set.push(objectSection);
			}
		}
		return set;
	}

	private filterAND(operandList: Array<Operator | Operand | null>) {
		let iteratorCount: number = this.data.length;
		let set: any = [];
		let setComplement: any = [];
		let setCounter: number = 0;
		for(const element of operandList) {
			if(Array.isArray(element)) {
				setCounter++;
				setComplement = setter.setIntersect(setComplement, element);
			}
		}
		if(setCounter === operandList.length) {
			return setComplement;
		}
		while (iteratorCount--) {
			let keepSection: boolean = true;
			let objectSection: any = this.data[iteratorCount];
			keepSection = this.innerFilterAND(operandList, objectSection, keepSection);
			if (keepSection) {
				set.push(objectSection);
			}
		}
		if(set.length === 0) {
			return setComplement;
		} else if(setComplement.length > 0 || setCounter > 0) {
			set = setter.setIntersect(set, setComplement);
		}
		return set;
	}

	private innerFilterAND(operandList: Array<Operator | Operand | null>, objectSection: any, keepSection: boolean) {
		for (const element of operandList) {
			if (Array.isArray(element) || element === null) {
				continue;
			}
			let elementOperand = element as Operand;
			if (elementOperand.comparator === MCOMPARATOR.GT) {
				if (objectSection[elementOperand.field] <= elementOperand.value) {
					keepSection = false;
					break;
				}
			} else if (elementOperand.comparator === MCOMPARATOR.LT) {
				if (objectSection[elementOperand.field] >= elementOperand.value) {
					keepSection = false;
					break;
				}
			} else if (elementOperand.comparator === MCOMPARATOR.EQ) {
				if (objectSection[elementOperand.field] !== elementOperand.value) {
					keepSection = false;
					break;
				}
			} else if (elementOperand.comparator === SCOMPARISON.IS) {
				let stringReg: string = elementOperand.value as string;
				let regExp = new RegExp(this.regexString(stringReg));
				if (!regExp.test(objectSection[elementOperand.field])) {
					keepSection = false;
					break;
				}
			}
		}
		return keepSection;
	}

	/**
	 * @param inputString The string from the SCOMPARATOR Operand object in its value key
	 */
	private regexString(inputString: string): string {
		if(inputString === "**") {
			return "(.*?)";
		}
		if(inputString.charAt(0) === "*" && inputString.charAt(inputString.length - 1) === "*") {
			return inputString.replace("*", "");

		} else if(inputString.charAt(0) === "*") {
			return inputString.concat("$").replace("*", "");

		} else if(inputString.charAt(inputString.length - 1) === "*") {
			return "^".concat(inputString).replace("*", "");
		} else {
			return "^".concat(inputString).concat("$").replace("*", "");
		}
	}
}
