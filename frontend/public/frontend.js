document.getElementById("instructor-form").addEventListener("submit", handleFormInstructor);
document.getElementById("avg-form").addEventListener("submit", handleFormAvg);

async function handleFormAvg(event) {
	event.preventDefault();

	let form = event.currentTarget;

	try {
		let formData = new FormData(form);
		let resData = await postFormAvg({formData});
		let res = JSON.parse(JSON.stringify(resData))["result"];
		if (res.length === 0) {
			alert("No courses found");
		} else {
			let sum = 0;
			for (const item of res) {
				sum += item["courses_avg"];
			}
			let avg = sum / res.length;

			alert("Average: \n" + avg);
		}
	} catch(err) {
		alert("Try new input");
	}
}

async function postFormAvg({formData}) {
	let jsonData = JSON.parse(JSON.stringify(Object.fromEntries(formData.entries())));
	let startYear = parseInt(jsonData["start"], 10);
	let endYear = parseInt(jsonData["end"], 10);
	let id = jsonData["course_id"];
	let dpt = jsonData["course_dpt"];
	if (startYear < 1900 || endYear < startYear || id === "" || dpt == "") {
		throw new Error();
	}
	startYear -= 1;
	endYear += 1;
	console.log()
	let res = await fetch("http://localhost:4321/query", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		body: JSON.stringify({
			WHERE: {
				AND: [
					{
						IS: {
							"courses_dept": dpt
						}
					},
					{
						IS: {
							"courses_id": id
						}
					},
					{
						GT: {
							"courses_year": startYear
						}
					},
					{
						LT: {
							"courses_year": endYear
						}
					}
				]
			},
			OPTIONS: {
				COLUMNS: [
					"courses_avg"
				]
			}
		})
	});

	return res.json();
}

async function handleFormInstructor(event) {
	event.preventDefault();

	let form = event.currentTarget;

	try {
		let formData = new FormData(form);
		let resData = await postFormInstructor({formData});
		let res = JSON.parse(JSON.stringify(resData))["result"];
		if (res.length === 0) {
			alert("No courses taught by this instructor");
		} else {
			let resString = "";
			for (const item of res) {
				resString += item["courses_dept"] + " " + item["courses_id"] + " " + item["courses_year"] + "\n";
			}
			alert("Courses taught by this instructor: \n" + resString);
		}
	} catch(err) {
		alert("Try new input");
	}
}

async function postFormInstructor({formData}) {
	let jsonData = JSON.parse(JSON.stringify(Object.fromEntries(formData.entries())));
	let res = await fetch("http://localhost:4321/query", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Accept": "application/json"
		},
		body: JSON.stringify({
				WHERE: {
					IS: {
						"courses_instructor": jsonData["instructor_name"]
					}
				},
				OPTIONS: {
					COLUMNS: [
						"courses_dept",
						"courses_id",
						"courses_year",
						"courses_instructor"
					]
				}
			})
	});

	return res.json();
}
