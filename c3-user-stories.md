Please edit this template and commit to the master branch for your user stories submission.   
Make sure to follow the *Role, Goal, Benefit* framework for the user stories and the *Given/When/Then* framework for the Definitions of Done! You can also refer to the examples DoDs in [C3 spec](https://sites.google.com/view/ubc-cpsc310-21w2-intro-to-se/project/checkpoint-3).

## User Story 1
"As a student, I want to be able to see which courses are offered by a specific instructor, so that I may see their courses."


#### Definitions of Done(s)
Scenario 1: The instructor is shown
Given: The user is on the page. 
When: The user enters the instrutor's name in a search bar and clicks search 
Then: The application returns a textbox of the courses for the given instructor

Scenario: The instructor is not shown/known 
Given: The user is on the page. 
When: The user enters the instructor's name in a search bar and clicks search
Then: The application finds no courses for the given instructor, return error or null try a different input.

## User Story 2
"As a student, I want to be able to select a course and a time interval, so that I can know the average of the course during that period"


#### Definitions of Done(s)
Scenario 1: valid inputs
Given: The user is on the main page
When: The user enters a valid course and a valid time interval in the corresponding drop down menu and clicks the button "Show"
Then: The application presents the average of the course during that period

Scenario 2: invalid inputs
Given: The user is on the main page
When: The user enters an invalid course or an invalid time interval in the corresponding drop down menu and clicks "Show"
Then: The application remains in the main page and shows an error telling the user to try different inputs

## Others
You may provide any additional user stories + DoDs in this section for general TA feedback.  
Note: These will not be graded.
