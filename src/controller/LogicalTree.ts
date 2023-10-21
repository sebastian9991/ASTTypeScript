import Validate, {LOGIC, MCOMPARATOR, QUERY, SCOMPARISON} from "./Validate";
import Set from "./Set";
let validator: Validate = new Validate();
let setter: Set = new Set();
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
/*
Author: Eli Elad Elrom
Website: https://EliElrom.com
License: MIT License
Component: src/utils/BinaryTree.tsx
 */
export class Node <O> {
	public value: O | null;
	public children: Array<Node<O>> | null;
	constructor(value: O | null) {
		this.value = value;
		this.children = [];
	}

	public getValue(): O | null {
		return this.value;
	}

}
export default class LogicalTree {
	public tree: Node<Operand | Operator> = new Node<Operand | Operator>(null);
	/**
	 * @param query this query is validated
	 */
	public formatQuery(query: any): boolean {
		if(query[QUERY.WHERE] !== undefined && query[QUERY.OPTIONS] !== undefined) {
			if(validator.checkLOGICCOMP(query[QUERY.WHERE])) {
				this.tree = this.loopFilterTree(query[QUERY.WHERE], null);
			} else if (validator.checkMCOMP(query[QUERY.WHERE])) {
				for (const mcomparatorEnumElement in MCOMPARATOR) {
					if (query[QUERY.WHERE][mcomparatorEnumElement] !== undefined) {
						let fieldAndValue = this.splitKey(query[QUERY.WHERE][mcomparatorEnumElement]);
						let root: Operand = {
							comparator: mcomparatorEnumElement,
							field: fieldAndValue[0],
							value: fieldAndValue[1]

						};
						this.tree.value = root;
						break;
					}
				}
			} else if (validator.checkSCOMP(query[QUERY.WHERE])) {
				let fieldAndValue = this.splitKey(query[QUERY.WHERE][SCOMPARISON.IS]);
				let root: Operand = {
					comparator: SCOMPARISON.IS,
					field: fieldAndValue[0],
					value: fieldAndValue[1]

				};
				this.tree.value = root;
			}
		}
		return true;
	}

	/**
	 * @param query
	 */
	public loopFilterTree(query: any, prevNode: Node<Operand | Operator> | null): any {
		for(const logicEnumElement in LOGIC) {
			if(query[logicEnumElement] !== undefined) {
				let nextNode = this.createNextNodeOperator(logicEnumElement);
				if(prevNode !== null){
					prevNode.children?.push(nextNode);
				}
				if(logicEnumElement === LOGIC.NOT) {
					let queryNOT: any = query[LOGIC.NOT];
					if(validator.checkLOGICCOMP(queryNOT)) {
						this.loopFilterTree(queryNOT, nextNode);
					} else if(validator.checkMCOMP(queryNOT)) {
						for(const mcomparatorEnumElement in MCOMPARATOR) {
							if(queryNOT[mcomparatorEnumElement] !== undefined) {
								if (queryNOT[mcomparatorEnumElement] !== undefined) {
									this.createMcompNode(queryNOT, mcomparatorEnumElement, nextNode);
									break;
								}
							}
						}
					} else if(validator.checkSCOMP(queryNOT)) {
						this.createScompNode(queryNOT, nextNode);
						break;
					}
					if(prevNode === null){
						return nextNode;
					} else {
						return prevNode;
					}
				}
				for (const element of query[logicEnumElement]) {
					if (validator.checkLOGICCOMP(element)) {
						this.loopFilterTree(element, nextNode);
					} else if (validator.checkMCOMP(element)) {
						for (const mcomparatorEnumElement in MCOMPARATOR) {
							if (element[mcomparatorEnumElement] !== undefined) {
								this.createMcompNode(element, mcomparatorEnumElement, nextNode);
							}
						}
					} else if (validator.checkSCOMP(element)) {
						this.createScompNode(element, nextNode);
					}
				}
				return this.chooseNode(prevNode, nextNode);
			}
		}
		return new Node<Operand | Operator>(null);
	}

	private chooseNode(prevNode: Node<Operand | Operator> | null, nextNode: Node<Operand | Operator>) {
		if (prevNode === null) {
			return nextNode;
		} else {
			return prevNode;
		}
	}

	private createScompNode(queryNOT: any, nextNode: Node<Operand | Operator>) {
		let fieldAndValue = this.splitKey(queryNOT[SCOMPARISON.IS]);
		let node: Operand = {
			comparator: SCOMPARISON.IS,
			field: fieldAndValue[0],
			value: fieldAndValue[1]
		};
		let operandNode: Node<Operand | Operator> = new Node<Operand | Operator>(node);
		nextNode.children?.push(operandNode);
	}

	private createMcompNode(element: any, mcomparatorEnumElement: string, nextNode: Node<Operand | Operator>) {
		let fieldAndValue = this.splitKey(element[mcomparatorEnumElement]);
		let node: Operand = {
			comparator: mcomparatorEnumElement,
			field: fieldAndValue[0],
			value: fieldAndValue[1]
		};
		let operandNode: Node<Operand | Operator> = new Node<Operand | Operator>(node);
		nextNode.children?.push(operandNode);
	}

	/**
	 * @param obj The obj to an MCOMPARATOR or SCOMPARATOR Index
	 */
	public splitKey(obj: any): any[] {
		let KeyAndValueArray: any[] = [];
		let splitStringArray = Object.keys(obj)[0].split("_");
		let value = Object.values(obj)[0];
		let keyField = splitStringArray[1];
		KeyAndValueArray.push(keyField);
		KeyAndValueArray.push(value);
		return KeyAndValueArray;
	}

	/**
	 * @param operator The LOGIC Comparator to input
	 * EFFECTS: Returns a node with the value as the LOGIC Comparator
	 */
	public createNextNodeOperator(operator: string): Node<Operand | Operator> {
		let root: Operator = {
			logic: operator
		};
		let nextNode: Node<Operand | Operator> = new Node<Operand | Operator>(root);
		return nextNode;
	}
}
