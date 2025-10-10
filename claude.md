### Follow Up Questions
When thinking about how to tackle requests, if you have ANY uncertainty or ambiguity over how exactly I  am asking you to accomplish a task, ASK ME QUESTIONS so I can clarify them to give you more specific notes. NEVER ASSUME ANYTHING. 

### Git/Repo Rules
CRITICAL: NEVER do ANY git command that involves a commit to local git or push to remote repository unless you are specifically prompted to do so.  Before you do ANY kind of commit or push ALWAYS ask if it's okay to do so first. No EXCEPTIONS. Do not advertise that Claude code (or any associated products) was used in any of the commit messages.

### Planning Phase
When attempting to tackle a complicated task and/or if the user directly asks you to  plan how to tackle a complicated process, always save the plan to a markdown file and ask the user to review first before taking any more steps. The plan should always be broken down into manageable chunks whose completion can be verified by the user in some sort of testing format/instructions. 

### Documentation
Documentation for the project should be stored in the devdocs folder. That folder should be structured as follows:
devdocs (root)
-devdocs.md - (documentation overview of the project that contains references to sub devdocs)
-devdocs_[featurename].md - a sub devdoc markdown detailed documentation about a major feature, referenced in the master devdocs.md 
-plan (folder)
--plan_[featurename].md - plan markdowns for specific feature planning
-questions (folder)
--questions_[featurename] - questions related to a specific project request, that the developer can answer to provide more details in creating a specific plan.
-progress (folder)
-- progress_[planname].md - where you can update the progress of various stages of the plan as we complete them. 

If these folders do not exist at first, you can create them as needed.

