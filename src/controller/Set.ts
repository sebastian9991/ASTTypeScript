export default class Set {
	/** https://thispointer.com/5-ways-to-merge-two-arrays-and-remove-duplicates-in-javascript/
	 * @param set The set that is created in the filter, potentiall empty
	 * @param element The array that is not empty that must be unionized with set
	 */
	public setUnion(set: any[], element: any[]) {
		if(set.length === 0) {
			return element;
		}
		return set.concat(element.filter((x) => set.indexOf(x) < 0));
	}

	/**
	 * @param set The set that is created in the AND filter
	 * @param element The array that is from the operandList
	 */
	public setIntersect(set: any[], element: any[]) {
		if(set.length === 0) {
			return element;
		}
		return set.filter((x) => element.includes(x));
	}
}
