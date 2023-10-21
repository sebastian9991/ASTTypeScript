export default class Section {
	private readonly dept: string | undefined;
	private readonly id: string | undefined;
	private readonly avg: number | undefined;
	private readonly instructor: string | undefined;
	private readonly title: string | undefined;
	private readonly pass: number | undefined;
	private readonly fail: number | undefined;
	private readonly audit: number | undefined;
	private readonly uuid: string | undefined;
	private readonly year: number | undefined;

	constructor(
		dept: string | undefined,
		id: string | undefined,
		avg: number | undefined,
		instructor: string | undefined,
		title: string | undefined,
		pass: number | undefined,
		fail: number | undefined,
		audit: number | undefined,
		uuid: string | undefined,
		year: number | undefined
	) {
		this.dept = dept;
		this.id = id;
		this.avg = avg;
		this.instructor = instructor;
		this.title = title;
		this.pass = pass;
		this.fail = fail;
		this.audit = audit;
		this.uuid = uuid;
		this.year = year;
	}
}
