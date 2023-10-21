import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";
import {expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives} from "../TestUtil";
import * as fs from "fs-extra";
import {folderTest} from "@ubccpsc310/folder-test";

use(chaiAsPromised);


type Input = unknown;
type Output = Promise<InsightResult[]>;
type Error = "InsightError" | "ResultTooLargeError";

describe("InsightFacade", function () {
	// For more than one test global scope
	let courses: string;
	let coursesBig: string;
	let insightFacade: InsightFacade;

	const persistDir = "./data";
	const datasetContents = new Map<string, string>();

	// Reference any datasets you've added to test/resources/archives here and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		courses: "./test/resources/archives/courses.zip",
		notZip: "./test/resources/archives/not_zip.txt",
		testZip: "./test/resources/archives/test.zip",
		courses1: "./test/resources/archives/courses1.zip",
		courses2: "./test/resources/archives/courses2.zip",
		rooms: "./test/resources/archives/rooms.zip",
	};

	// Before clause:
	// Runs before each describe clause?
	before(function () {
		courses = getContentFromArchives("courses.zip");
		coursesBig = getContentFromArchives("courses.zip");

	});

	before(function () {
		// This section runs once and loads all datasets specified in the datasetsToLoad object
		for (const key of Object.keys(datasetsToLoad)) {
			const content = fs.readFileSync(datasetsToLoad[key]).toString("base64");
			datasetContents.set(key, content);
		}
		// Just in case there is anything hanging around from a previous run
		fs.removeSync(persistDir);
	});

	describe("Add/Remove/List Dataset", function () {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			console.info(`BeforeTest: ${this.currentTest?.title}`);
			insightFacade = new InsightFacade();
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
		});

		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent from the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			fs.removeSync(persistDir);
		});

		// This is a unit test. You should create more like this!
		it("should add a valid dataset", function () {
			const id: string = "courses";
			const content: string = datasetContents.get("courses") ?? "";
			const expected: string[] = [id];
			return insightFacade.addDataset(id, content, InsightDatasetKind.Courses).then((result: string[]) => {
				expect(result).to.deep.equal(expected);
			});
		});

		it("reject add invalid id with underscore", function () {
			const content: string = datasetContents.get("courses") ?? "";
			return insightFacade
				.addDataset("courses_", content, InsightDatasetKind.Courses)
				.then(() => {
					throw new InsightError("Invalid id with underscore");
				})
				.catch((err) => {
					expect(err).to.be.instanceof(InsightError);
				});
		});

		it("reject add invalid id with only whitespace characters", function () {
			const content: string = datasetContents.get("courses") ?? "";
			return insightFacade
				.addDataset(" ", content, InsightDatasetKind.Courses)
				.then(() => {
					throw new InsightError("Invalid id with only whitespace characters");
				})
				.catch((err) => {
					expect(err).to.be.instanceof(InsightError);
				});
		});

		it("reject add invalid id equals to empty string", function () {
			const content: string = datasetContents.get("courses") ?? "";
			return insightFacade
				.addDataset("", content, InsightDatasetKind.Courses)
				.then(() => {
					throw new InsightError("Invalid id equals to empty string");
				})
				.catch((err) => {
					expect(err).to.be.instanceof(InsightError);
				});
		});

		it("reject add id same as id of an already added dataset", function () {
			const content: string = datasetContents.get("courses") ?? "";
			return insightFacade.addDataset("courses", content, InsightDatasetKind.Courses).then(() => {
				return insightFacade
					.addDataset("courses", content, InsightDatasetKind.Courses)
					.then(() => {
						throw new InsightError("Id already of an already added dataset");
					})
					.catch((err) => {
						expect(err).to.be.instanceof(InsightError);
					});
			});
		});

		it("fulfill add one dataset", function () {
			const content: string = datasetContents.get("courses") ?? "";
			return insightFacade.addDataset("courses", content, InsightDatasetKind.Courses).then((addedIds) => {
				expect(addedIds).to.be.an.instanceof(Array);
				expect(addedIds).to.have.length(1);
				expect(addedIds[0]).to.equal("courses");
			});
		});

		it("fulfill add multiple datasets", function () {
			const content: string = datasetContents.get("courses") ?? "";
			return insightFacade.addDataset("courses", content, InsightDatasetKind.Courses).then(() => {
				return insightFacade.addDataset("courses1", content, InsightDatasetKind.Courses).then((addedIds) => {
					expect(addedIds).to.be.an.instanceof(Array);
					expect(addedIds).to.have.length(2);
					expect(addedIds[0]).to.equal("courses");
					expect(addedIds[1]).to.equal("courses1");
				});
			});
		});

		it("fulfill add dataset with valid id containing whitespace", function () {
			const content: string = datasetContents.get("courses") ?? "";
			return insightFacade.addDataset("courses ", content, InsightDatasetKind.Courses).then((addedIds) => {
				expect(addedIds).to.be.an.instanceof(Array);
				expect(addedIds).to.have.length(1);
				expect(addedIds[0]).to.equal("courses ");
			});
		});

		it("reject not a zip file", function () {
			const content: string = datasetContents.get("notZip") ?? "";
			return insightFacade
				.addDataset("courses", content, InsightDatasetKind.Courses)
				.then(() => {
					throw new InsightError("Not a zip file");
				})
				.catch((err) => {
					expect(err).to.be.instanceof(InsightError);
				});
		});

		it("reject root directory does not contain folder courses", function () {
			const content: string = datasetContents.get("testZip") ?? "";
			return insightFacade
				.addDataset("courses", content, InsightDatasetKind.Courses)
				.then(() => {
					throw new InsightError("Root directory does not contain folder courses");
				})
				.catch((err) => {
					expect(err).to.be.instanceof(InsightError);
				});
		});

		it("reject contains no valid course section", function () {
			const content: string = datasetContents.get("courses1") ?? "";
			return insightFacade
				.addDataset("courses", content, InsightDatasetKind.Courses)
				.then(() => {
					throw new InsightError("Dataset contains no valid course section");
				})
				.catch((err) => {
					expect(err).to.be.instanceof(InsightError);
				});
		});

		it("fulfill contains exactly one valid course section", function () {
			const content: string = datasetContents.get("courses2") ?? "";
			return insightFacade
				.addDataset("courses", content, InsightDatasetKind.Courses)
				.then(() => insightFacade.listDatasets())
				.then((insightDatasets) => {
					expect(insightDatasets).to.be.an.instanceof(Array);
					expect(insightDatasets).to.have.length(1);
					expect(insightDatasets).to.deep.equal([
						{
							id: "courses",
							kind: InsightDatasetKind.Courses,
							numRows: 1,
						},
					]);
				});
		});

		it("should add a valid room dataset", function () {
			const id: string = "rooms";
			const content: string = datasetContents.get("rooms") ?? "";
			const expected: string[] = [id];
			return insightFacade.addDataset(id, content, InsightDatasetKind.Rooms).then((result: string[]) => {
				expect(result).to.deep.equal(expected);
			});
		});

		it("should list no datasets", function () {
			return insightFacade.listDatasets().then((insightDatasets) => {
				// expect(insightDatasets).to.deep.equal([]);

				expect(insightDatasets).to.be.an.instanceof(Array);
				expect(insightDatasets).to.have.length(0);
			});
		});

		it("should list one datasets", function () {
			const content: string = datasetContents.get("courses") ?? "";
			return insightFacade
				.addDataset("courses", content, InsightDatasetKind.Courses)
				.then(() => insightFacade.listDatasets())
				.then((insightDatasets) => {
					expect(insightDatasets).to.deep.equal([
						{
							id: "courses",
							kind: InsightDatasetKind.Courses,
							numRows: 64612,
						},
					]);
				});
		});

		it("should list multiple datasets", function () {
			const content: string = datasetContents.get("courses") ?? "";
			return insightFacade
				.addDataset("courses", content, InsightDatasetKind.Courses)
				.then(() => {
					return insightFacade.addDataset("courses-2", content, InsightDatasetKind.Courses);
				})
				.then(() => {
					return insightFacade.listDatasets();
				})
				.then((insightDatasets) => {
					expect(insightDatasets).to.be.an.instanceof(Array);
					expect(insightDatasets).to.have.length(2);
					const insightDatasetsCourses = insightDatasets.find((dataset) => dataset.id === "courses");
					expect(insightDatasetsCourses).to.exist;
					expect(insightDatasetsCourses).to.deep.equal({
						id: "courses",
						kind: InsightDatasetKind.Courses,
						numRows: 64612,
					});
				});
		});

		it("reject remove invalid id with underscore", function () {
			return insightFacade
				.removeDataset("courses_")
				.then(() => {
					throw new InsightError("Invalid id with underscore");
				})
				.catch((err) => {
					expect(err).to.be.an.instanceof(InsightError);
				});
		});

		it("reject remove invalid id with only whitespace characters", function () {
			return insightFacade
				.removeDataset(" ")
				.then(() => {
					throw new InsightError("Invalid id with only whitespace characters");
				})
				.catch((err) => {
					expect(err).to.be.instanceof(InsightError);
				});
		});

		it("reject remove a dataset that hasn't been added", function () {
			return insightFacade
				.removeDataset("courses")
				.then(() => {
					throw new NotFoundError("Dataset hasn't been added");
				})
				.catch((err) => {
					expect(err).to.be.instanceof(NotFoundError);
				});
		});

		it("fulfill success removal", function () {
			const content: string = datasetContents.get("courses") ?? "";
			return insightFacade.addDataset("courses", content, InsightDatasetKind.Courses).then(() => {
				return insightFacade.removeDataset("courses").then((removedIds) => {
					expect(removedIds).to.equal("courses");
				});
			});
		});
	});

	describe("Perform Query FOLDER TESTING", function ()  {
		let facade3: IInsightFacade = new InsightFacade();
		before(async function () {
			clearDisk();
			await facade3.addDataset("courses", courses, InsightDatasetKind.Courses);
			await facade3.addDataset("coursesBig", coursesBig, InsightDatasetKind.Courses);
		});

		// after(function () {
		// 	// This section resets the data directory (removing any cached data)
		// 	// This runs after each test, which should make each test independent from the previous one
		// 	console.info(`AfterTest: ${this.currentTest?.title}`);
		// 	fs.removeSync(persistDir);
		// });

		function assertResult(actual: any, expected: Awaited<Output> ): void | PromiseLike<void> {
			expect(actual).to.deep.equal(expected);

		}

		function assertError(actual: any, expected: Error): void {


			if(expected === "ResultTooLargeError") {
				expect(actual).to.be.an.instanceof(ResultTooLargeError);
			} else if(expected === "InsightError") {
				expect(actual).to.be.an.instanceof(InsightError);
			} else {
				// Error.

			}
		}

		folderTest<Input, Output, Error>(
			"PerformQuery tests",
			(input: Input): Output => facade3.performQuery(input),
			"./test/resources/queries",
			{
				assertOnResult : assertResult,
				assertOnError : assertError,
			}

		);
	});

	describe ("PerformQuery valid EBNF Test", function () {
		let facade4: InsightFacade;
		facade4 = new InsightFacade();
		before(async function () {
			clearDisk();
			await facade4.addDataset("courses", courses, InsightDatasetKind.Courses);
			await facade4.addDataset("coursesBig", coursesBig, InsightDatasetKind.Courses);
		});

		// afterEach(function () {
		// 	// This section resets the data directory (removing any cached data)
		// 	// This runs after each test, which should make each test independent from the previous one
		// 	console.info(`AfterTest: ${this.currentTest?.title}`);
		// 	fs.removeSync(persistDir);
		// });

		let obj: any = {
			WHERE: {
			},
			OPTIONS: {
				COLUMNS: [
					"courses_dept",
					"courses_id",
					"courses_avg"
				]
			}
		};

		it("PerformQuery", function () {
			return facade4.performQuery(obj);
		});
	});
});
