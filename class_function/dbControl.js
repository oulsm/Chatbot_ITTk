var admin = require("firebase-admin");

module.exports = {

    // Add document into the database
    addToDB: async function (db, doc, username, cName) {
        const ref = await db.collection(cName).doc(username).set(doc);
    },

    // Add more field into the database
    pushToDB: async function (db, doc, username, cName) {
        const ref = await db.collection(cName).doc(username).update(doc);
    },

    // Get document from database
    getFromDB: async function (db, cName, username, callback) {
        const doc = await db.collection(cName).doc(username).get();
        callback(doc);
    },

    // Remove document from database
    removeFromDB: async function (db, cName, username){
        db.collection(cName).doc(username).delete();
    },

    getFromMulit: async function (db, cName, username, callback) {
        var docs = []
        for (const name of cName) {
            var doc = await db.collection(name).doc(username).get();
            docs.push(doc);
        }
        callback(docs);
    },

    // Create User document
    addUsers: async function (db, req) {
        doc = {
            name: req.body.name,
            email: req.body.email,
            contactno: req.body.contact,
            DoB: req.body.DoB,
            username: req.body.username
        }
        this.addToDB(db, doc, req.body.username, "Users")
    },

    // Create CV document
    addResume: async function (db, username, req) {
        const award = [];
        const activity = [];
        const project = [];
        const work = [];
        projectname = req.body.projectName,
            projectrole = req.body.projectRole,
            projectstart = req.body.projectStart,
            projectend = req.body.projectEnd,
            projectdesc = req.body.projectDesc,

            companyname = req.body.companyName,
            Position = req.body.position,
            Salary = req.body.salary,
            yearofexp = req.body.yearOfexp,
            workresponsibility = req.body.workResponsibility,

            activityname = req.body.activityName,
            Organizer = req.body.organizer,
            activerole = req.body.activeRole,
            periodstart = req.body.periodStart,
            periodend = req.body.periodEnd,
            activitydetail = req.body.activityDetail,

            awardtitle = req.body.awardTitle;
            awardtype = req.body.awardType;
            receivedtime = req.body.receivedTime;
            console.log(awardtitle)
        //multi-award
        if (typeof awardtitle === 'string' && awardtitle ==""){
            award.push[""]           
        } else if (typeof awardtitle === 'string') {
            const temp1 = { awardTitle: awardtitle, receivedTime: receivedtime, awardType:parseInt(awardtype) };
            award.push(temp1)
        }else{
            for (let i = 0; i < awardtitle.length; i++) {
                const temp1 = { awardTitle: awardtitle[i], receivedTime: receivedtime[i], awardType:parseInt(awardtype[i]) }
                award.push(temp1)
            };
        }
        //multi-project
        if (typeof projectname === 'string' && projectname ==""){
            project.push[""]           
        } else if (typeof projectname === 'string') {

            const temp1 = {
                projectName: projectname,
                projectRole: parseInt(projectrole),
                projectStart: projectstart,
                projectEnd: projectend,
                projectDesc: projectdesc
            }
            project.push(temp1)

        } else {
            for (let i = 0; i < projectname.length; i++) {
                const temp1 = {
                    projectName: projectname[i],
                    projectRole: parseInt(projectrole[i]),
                    projectStart: projectstart[i],
                    projectEnd: projectend[i],
                    projectDesc: projectdesc[i],
                };
                project.push(temp1)
            };
        };
        //multi-activity
        if (typeof activityname === 'string' && activityname ==""){
            activity.push[""]           
        } else if (typeof activityname === 'string') {

            const temp1 = {
                activityName: activityname,
                organizer: Organizer,
                activeRole: parseInt(activerole),
                periodStart: periodstart,
                periodEnd: periodend,
                activityDetail: activitydetail, 
                
            }
            activity.push(temp1)

        } else {
            for (let i = 0; i < activityname.length; i++) {
                const temp1 = {
                    activityName: activityname[i],
                    organizer: Organizer[i],
                    activeRole: parseInt(activerole[i]),
                    periodStart: periodstart[i],
                    periodEnd: periodend[i],
                    activityDetail: activitydetail[i], 
                    
                };
                activity.push(temp1)
            };
        };
        //multi-work
        if (typeof companyname === 'string' && companyname ==""){
            work.push[""]           
        } else if (typeof companyname === 'string') {

            const temp1 = {
                companyName : companyname,
                position : parseInt(Position),
                salary : parseFloat(Salary),
                yearOfexp : parseFloat(yearofexp),
                workResponsibility: workresponsibility,

            }
            work.push(temp1)

        } else {
            for (let i = 0; i < companyname.length; i++) {
                const temp1 = {
                    companyName : companyname[i],
                    position : parseInt(Position[i]),
                    salary : parseFloat(Salary[i]),
                    yearOfexp : parseFloat(yearofexp[i]),
                    workResponsibility: workresponsibility[i]
                };
                work.push(temp1)
            };
        };
        doc = {
             firstname: req.body.firstname,
             lastname: req.body.lastname,
             contactNo: req.body.contactNo,
             email: req.body.email,
             qualification: parseInt(req.body.qualification),
             institution: req.body.institution,
             major: req.body.major,
             finishYear: req.body.finishYear,
             CGPA: parseFloat(req.body.CGPA),
             honor: parseInt(req.body.honor),
             language: req.body.language,
             Pro_language: req.body.Pro_language,
             skill: req.body.skillName,             
            activity: activity,
            project: project,
            work: work,
            award: award,

        }
       
      
      
            this.addToDB(db, doc, username, "Resume")
      
        
    },

    // Create Job description document
    addJobdescription: async function (db, username, req) {
        doc = {
            title: req.body.job_title,
            job_type: req.body.job_type,
            qualification: parseInt(req.body.qualification),
            career_level: parseInt(req.body.career_level),
            YoE: parseInt(req.body.YoE),
            pay_range: [parseFloat(req.body.lower), parseFloat(req.body.upper)],
            job_duty: req.body.job_duty,
            job_req: req.body.job_req,
            language_req: req.body.language_req,
            pro_language_req: req.body.pro_language_req,
            company_name: req.body.company_name,
            field_of_company: req.body.fieldOfCompany,
            company_overview: req.body.company_overview
        }
        this.addToDB(db, doc, username, "Job")
    },

    // Create Question document
    addQuestion: async function (db, req) {

        ques_type = req.body.ques_type,

            this.getFromDB(db, req, "Question", ques_type, async function (doc) {
                docs = {

                    question: admin.firestore.FieldValue.arrayUnion(req.body.question)

                }
                if (doc.exists) {
                    const ref = await db.collection("Question").doc(ques_type).update(docs);

                }
                else {
                    const ref = await db.collection("Question").doc(ques_type).set(docs);
                }
            });
    },
}