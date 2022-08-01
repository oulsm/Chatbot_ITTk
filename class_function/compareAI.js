//#region -------------------------------------------------------------Vairable init-------------------------------------------------------------

const match = require("nodemon/lib/monitor/match");
const wordsCount = require("words-count").default;
const textgears = require("textgears-api");
const { wordsSplit } = require("words-count");
const { compare } = require("string-compare");
const stringComparison = require('string-comparison');
const e = require("connect-flash");
const mathjs = require("mathjs");
const synonyms = require("synonyms");

const cos = stringComparison.cosine;
const textgearsApi = textgears('xyi8Btzm6zG6CHXV', {language: 'en-US'});

//#endregion

//#region -------------------------------------------------------------Static Keywords-------------------------------------------------------------

// Create keys for word comparsion
const Keys = {
    Polite:["greeting"],
    Global:["Experience","idea","DescribeStrength","DescribeWeakness","Important","information",
            "opportunity","Personality","Programme","reading","Weakness","Strengeth"],
    Work : ["YearsOfWorkExperience","Internship","Career_fields","jobduty","IT_Position",
            "Company","Industry","JobDuty","OperatingSystem","Role","Supervisor","TechnicalDefine","TechnologyBenefits","UtilizeTechnology",
            "UtilizeTechnologyDescripiton","WorkHours"],
    Activity : ["Activity","ActivityDetail","competition","ActivityOrganiser"],
    Awards : ["Awards","Awardreceivedyear","AwardReceivedYear"],
    College : ["Major","honour","gpa","College","DurationOfStudy","EducationLevel"],
    Project : ["ProjectDetails","role","Project","OperatingSystem","Role","TechnicalDefine","TechnologyBenefits","UtilizeTechnology",
                "UtilizeTechnologyDescripiton"],
    Skills : ["programminglanguage","Software","language","knowledge","OperatingSystem","Skill"]
    //Person : ["person"]
};

const Roles = {
    
}

const QuestionSet = {
    badAns:["What do you mean?","Can you explain one more time?"],
    companyrel:["Can you give any suggestions on our service?"],
    coderel:["Do you know about #?","Can you tell me the most interesting part?"],
    badcode:["In your resume, you told us you are not familiar with #. Still, can you give any knowledge about that?"],
    null:[""]
};

const nonUserful = ["in","the","is","are","was","were","am","on"
    ,"at","of","to","and","or","able","a","an","so","for","can",
    "it","i","we","they","he","she","them","him","her","our","like",
    "their","my","from","as","1","2","3","4","5","6","7","8","9","0",
    "x","no","yes","yours","your","you","now","up","down"];

//#endregion

module.exports = {

    // Analysis the CV with job description(Return JSON)
    analyCVtojob: async function (user, jobdes, callback){
        // Variable init
        var qualmatch = false;
        var yoematch = false;
        var havepos = false;
        var CVkeywords = {
            College: {key: user.institution,words: this.wordsSplitArray(user.institution)},
            Awards: [],
            Skills: [],
            Activity: [],
            Project: [],
            Work : []
        };
        var jobdeskeywords = {
            Title: {key: jobdes.title,words: this.wordsSplitArray(jobdes.title)},
            Duty: [],
            Requirement: [],
            CompanyName: {key: jobdes.company_name,words: this.wordsSplitArray(jobdes.company_name)},
            CompanyOverview: {key: jobdes.company_overview,words: this.wordsSplitArray(jobdes.company_overview)}
        };
        var langmatch = {};
        var prolangmatch = {};
        var yoe = 0; 

        // Skill and Academic analysis
        // Comparsion of qualification
        if(user.qualification >= jobdes.qualification){
            qualmatch = true;
        }
        // Comparsion of languages requirements
        this.compareArray(user.language, jobdes.language_req,function(diff){
            langmatch = diff;
        });
        // Comparsion of programming languages requirements
        this.compareArray(user.Pro_language, jobdes.pro_language_req,function(diff){
            prolangmatch = diff;
        });
        // Work experience analysis
        user.work.forEach(e => {
            yoe = yoe + e.yearOfexp;
            // Comapare with highest working position to apply position
            if(e.position >= jobdes.career_level){
                havepos = true;
            }
            // Get keywords from the work
            e == "" ? null : CVkeywords.Work.push({key: e.companyName,words: this.wordsSplitArray(e.workResponsibility), role:e.position,salary:e.salary});
        });
        // Comaparsion of year of experience
        if(yoe >= jobdes.YoE){
            yoematch = true;
        }
        // Get keywords from the awards title
        user.award.forEach(a => {
            a == "" ? null : CVkeywords.Awards.push({key: a.awardTitle,words: this.wordsSplitArray(a.awardTitle), role:a.awardType});
        });
        // Get keywords from the skill
        try {
            user.skill.forEach(s => {
                s == "" ? null : CVkeywords.Skills.push({key: s,words: this.wordsSplitArray(s)});
            });
        } catch (error) {
            CVkeywords.Skills.push({key: user.skill,words: this.wordsSplitArray(user.skill)});
        }
        // Get keywords from the activity
        user.activity.forEach(a => {
            a == "" ? null : CVkeywords.Activity.push({key: a.activityName,words: this.wordsSplitArray(a.activityDetail), role:a.activeRole});
        });
        // Get keywords from the project
        user.project.forEach(p => {
            p == "" ? null : CVkeywords.Project.push({key: p.projectName,words: this.wordsSplitArray(p.projectDesc), role:p.projectRole});
        });

        // Get keywords from the job duty
        jobdes.job_duty.forEach(d => {
            d == "" ? null : jobdeskeywords.Duty.push({key: d,words: this.wordsSplitArray(d)});
        });
        // Get keywords from the job requirement
        jobdes.job_req.forEach(d => {
            d == "" ? null : jobdeskeywords.Requirement.push({key: d,words: this.wordsSplitArray(d)});
        });

        result = {
            qualmatch: qualmatch,
            CVkeywords: CVkeywords,
            jobdeskeywords: jobdeskeywords,
            yoematch: yoematch,
            havepos: havepos,
            workcount: user.work.length,
            awardcount: user.award.length,
            activitycount: user.activity.length,
            projectcount: user.project.length,
            langmatch: langmatch,
            prolangmatch: prolangmatch,
        }

        callback(result);
    },

    // Split line to words
    wordsSplitArray: function(text){
        let wordArray = [];
        let temp = wordsSplit(text);
        temp.forEach(w => {
            let l = w.toLowerCase();
            wordArray.includes(l)? null : nonUserful.includes(l)? null : wordArray.push(l);
        });
        return wordArray;
    },

    // Get random int
    getRandomInt: function (max) {
        return Math.floor(Math.random() * max);
    },

    // Compare two array(String)
    compareArray: async function (user,jobdes,callback) {

        var nonreq = user;
        var match = [];
        var unmatch = jobdes;

        for(var i = 0; i < jobdes.length; i++){
            for(var j = 0; j < user.length; j++){
                if(jobdes[i] == ""){
                    nonreq[j] = "";
                    unmatch[i] = "";
                } else {
                    if(jobdes[i] == user[j]){
                        match.push(jobdes[i]);
                        nonreq[j] = "";
                        unmatch[i] = "";
                    }
                }
            }
        }

        var temp1 = [];
        var temp2 = [];

        for(var i = 0; i < user.length; i++){
            if(nonreq[i] != ""){
                temp1.push(nonreq[i]);
            }
        }

        for(var i = 0; i < jobdes.length; i++){
            if(unmatch[i] != ""){
                temp2.push(unmatch[i]);
            }
        }
        callback({match : match, unmatch : temp2, nonreq : temp1});
    },

    // Analysis introduction
    analyIntro: async function (doc,intro,callback){

        var queryText = intro.fullText;
        var keyparam = {};
        let responseArray = intro.response;
        responseArray.forEach(lines => {
            for(var para in lines.parameter){
                if(lines.parameter[para] == "" || lines.parameter[para] == []){

                } else {
                    if(keyparam[para] == null){
                        keyparam[para] = lines.parameter[para];
                    } else {
                        
                            if(typeof keyparam[para] == 'string'){
                                let a = keyparam[para];
                                a = [a];
                                if(typeof lines.parameter[para] == 'string'){
                                    a.push(lines.parameter[para]);
                                } else {
                                    lines.parameter[para].forEach(words => {
                                        a.push(words);
                                    });
                                }
                                keyparam[para] = a;
                            } else if(typeof keyparam[para] == 'object'){
                                let a = keyparam[para];
                                if(typeof lines.parameter[para] == 'string'){
                                    a.push(lines.parameter[para]);
                                } else {
                                    lines.parameter[para].forEach(words => {
                                        a.push(words);
                                    });
                                }
                                keyparam[para] = a;
                            }
                    }
                }
            }
        });

        
        var errorTypeCount = {};

        var result = {};

        // Get word counts of the queryText
        result["summary"] = {};
        result.summary["wordCount"] = wordsCount(queryText);
        result.summary["lineCount"] = queryText.split('.').length - 1;
        result.summary["estSpeechTime"] = result.summary["wordCount"] / 130 * 60;
        
        // Get sentence grammar mistake
        await textgearsApi.checkGrammar(queryText).then((data) => {
                result["grammarReport"] = data.response.errors;
                result.summary["mistakeCount"] = data.response.errors.length;
                for(let i in data.response.errors){
                    let type = data.response.errors[i].type;
                    if(errorTypeCount[type] == null){errorTypeCount[type] = 1;} else {errorTypeCount[type] = errorTypeCount[type] + 1;}
                };
                result.summary["errorTypeCount"] = errorTypeCount;
            }).catch((err) => {});
        
        
        // Generate accuracy report to CV and intro
        await this.accuracyIntroReport(doc,keyparam, function(rs, r){
            for(var k in rs){
                result.summary[k] = rs[k];
            }
            result["similarityReport"] = r["similarityReport"]
        });

        callback(result);
    },

    //#region  --------------------------------------------------------Check accuracy to CV and intro and return result-----------------------
    accuracyIntroReport: async function(doc,keyparam, callback){
        var wordslist = {};

        // Loop through intro parameters JSON
        for (var p in keyparam){
            var key = p;
            /*if(p.includes('.original')){
                    key = p.slice(0,-9);
            }*/
            //if(keyparam.hasOwnProperty(p) && keyparam[p].length > 0){
                if(wordslist.hasOwnProperty(key)){
                    switch (typeof keyparam[p]){
                        case 'string':
                            wordslist[key].push(keyparam[p]);
                            continue;
                        case 'object':
                            keyparam[p].forEach(e => {
                                wordslist[key].push(e);
                            });
                            continue;
                        default:
                            console.log('None');
                    }
                } else {
                    switch (typeof keyparam[p]){
                        case 'string':
                            splitWords = this.wordsSplitArray(keyparam[p]);
                            wordslist[key] = splitWords;
                            continue;
                        case 'object':
                            wordslist[key] = [];
                            keyparam[p].forEach(e => {
                                temp = this.wordsSplitArray(e);
                                temp.forEach(w => {
                                    wordslist[key].push(w);
                                });
                            });
                            continue;
                        default:
                            console.log(key);
                    }
                }
            //} else {
            //    notgiven.indexOf(key) === -1 ? notgiven.push(key) : null;
            //}
        }

        // Check wordslist with CV accuracy
        let report = await this.IntroToCVReport(doc,wordslist);

        // More analysis
        let topicnotmetion = [];
        let greatestSim = {};
        let averageSimilar = {};
        let goodCount = {};

        for(var t in report.result){
            if(report.result[t].length <= 0){
                topicnotmetion.push(t);
                delete report.result[t];
                delete report.count[t];
            } else {
                let max = 0;
                let total = 0;
                goodCount[t] = 0;
                report.result[t].forEach(e => {
                    max = Math.max(e.max,e.mean,max,e.keysim);
                    total = total + e.mean;
                    if(e.keysim > 0.75){
                        goodCount[t] = goodCount[t] + 1;
                    }
                    for(let w in e.keywordssim){
                        if(e.keywordssim[w] > 0.75){
                            goodCount[t] = goodCount[t] + 1;
                        }
                    };
                    delete e.keysim;
                    delete e.keywordssim;
                });
                greatestSim[t] = max;
                averageSimilar[t] = total/report.result[t].length;
            }
        };

        // Construct result JSON
        var resultS = {
            topicnotmetion : topicnotmetion,
            topicmetiontimes: report.count,
            greatestSimilar :  greatestSim,
            averageSimilar : averageSimilar,
            goodCount : goodCount,
        }

        var result = {
            similarityReport : report.result
        }

        callback(resultS,result);
    },

    IntroToCVReport: async function(doc,wordslist){
        // The analysis result
        var result = {};
        var count = {};
        var mark = {};
        var keywords = doc.CVkeywords;
        
        for(var i in wordslist){
            for(var key in Keys){
                if(result[key] == null){result[key] = []; count[key] = 0;}
                // Separate the wordslist with key words in Keys
                let l = i.toLowerCase();
                if(Keys[key].indexOf(l) >= 0){
                    // Check if there is the anaylzed area
                    if(keywords[key] != null){
                        let report = {};
                        // Return { keysim: float, keywordssim: [Array] }
                        this.KeywordsSimilar(wordslist[i],keywords[key],(r) => {
                            mark = r;
                        });
                        // Analysis the keywordssim with mean
                        let sort = mark.keywordssim.sort();
                        let len = wordslist[i].length;
                        let temp = [];
                        for(let i = 0; i < len ; ++i){
                            temp.push(sort[sort.length - i - 1]);
                        }
                        //console.log(key,wordslist[i], temp);
                        let mean = parseFloat(mathjs.mean(temp).toFixed(3));  
                        mark["max"] = mathjs.max(sort);
                        mark["mean"] = mean;
                        mark["original"] =wordslist[i];
                        result[key].push(mark);
                        count[key] = count[key]+ 1;
                    } else {
                        //console.log(key, keywords[key]);
                    }
                }
                
            }
        }
        return {result, count};
    },

    KeywordsSimilar: async function(wordslist, keywords, callback){
        /* Algorithm:
            wordslist = [] // From IntroToCVReport
            keywords = { key : "" , words : []} or [{ key : "" , words : []},{ key : "" , words : []}] // From analyCVtojob

            Each wordslist's string compare to the key once and then compare to each string in words
            The compared value will between 0 to 1
            keydiff and diff is the length difference between the wordslist's string and the compare string
            The final similarity equals to the compared value / length difference
            For key and wordslist's string, take the highest value of all the wordslist's string comparsion // The value means the similarity with the original text in CV
            For wordslist's string and words's string, value is pushed to keywordssim[] for later evaluation // The value in array means each words similarity.
        */
        function compare(keywords,wordslist,keysim,keywordssim,lowsimwords){
            if(keywords.key != null){
                wordslist.forEach(w => {
                    let sim = cos.similarity(w, keywords.key);
                    keysim = parseFloat(Math.max(keysim,sim).toFixed(3));
                    keywords.words.forEach(e => {
                        let sim = cos.similarity(w, e);
                        keywordssim.push(parseFloat(sim.toFixed(3)));
                        if(sim > 0.75 && lowsimwords.indexOf(w) > -1){
                            lowsimwords.splice(lowsimwords.indexOf(w), 1);
                        }
                    });
                });
            } else {
                keywords.forEach(d => {
                    wordslist.forEach(w => {
                        let sim = cos.similarity(w, d.key);
                        keysim = parseFloat(Math.max(keysim,sim).toFixed(3));
                        d.words.forEach(e => {
                            let sim = cos.similarity(w, e);
                            keywordssim.push(parseFloat(sim.toFixed(3)));
                            if(sim > 0.75 && lowsimwords.indexOf(w) > -1){
                                lowsimwords.splice(lowsimwords.indexOf(w), 1);
                            }
                        });
                    });
                });
            }
        };

        var keysim = 0;
        var keywordssim = [];
        var lowsimwords = [];

        wordslist.forEach(w => {
            lowsimwords.push(w);
        });

        compare(keywords,wordslist,keysim,keywordssim,lowsimwords);

        if(lowsimwords.length > 0){
            lowsimwords.forEach(e => {
                let synA = synonyms(e);
                if(synA != null){
                    let lists = [];
                    for(var t in synA){
                        synA[t].forEach(w => {
                            lists.push(w);
                        });
                    }
                    compare(keywords,lists,keysim,keywordssim,lowsimwords);
                }
            });
        }

        callback({"keysim": keysim,"keywordssim" : keywordssim, "lowsimwords": lowsimwords});
    },
    //#endregion
    
    //#region

    // Analysis the question and answer
    analyQuestion: async function (doc, key,answer,callback){
        let report = {};
        report["key"] = key;

        //let questionC = answer.question.replace(/ /g,'').toLowerCase();
        let fullText = wordsSplit(answer.fullText);
        let para = answer.response[0].parameter;

        let area = answer.area;
        let subarea = answer.subarea;
        let usedValue = answer.usedValue;

        let responseQT = "";

        let pack = {
            "area" : area,
            "subarea" : subarea,
            "usedValue" : usedValue 
        };

        let paralen = Object.keys(para).length;

        // Change parameter JSON to array of keywords
        let paraArray = [];
        for(var p in para){
            if(para[p] == "" || para[p] == []){

            } else {
                if(typeof para[p] == "string"){
                    paraArray.push(para[p]);
                } else {
                    para[p].forEach(w => {
                        paraArray.push(w);
                    });
                }
            }
        }
        
        // Check the answer too short or not enough key parameters
        if(fullText.length < 3 || paralen < 1){
            responseQT = "badAns";
            report["followUpQ"] = this.generateFQ(responseQT, []);
        } else { 
            report = await this.prepareResponse(doc, pack, paraArray, report);
            report.summary["wordCount"] = fullText.length;
            report.summary["paraCount"] = paralen;
            // Check grammar in answer
            let errorTypeCount = {};
            await textgearsApi.checkGrammar(answer.fullText).then((data) => {
                report["grammarReport"] = data.response.errors;
                report.summary["mistakeCount"] = data.response.errors.length;
                for(let i in data.response.errors){
                    let type = data.response.errors[i].type;
                    if(errorTypeCount[type] == null){errorTypeCount[type] = 1;} else {errorTypeCount[type] = errorTypeCount[type] + 1;}
                };
                report.summary["errorTypeCount"] = errorTypeCount;
            }).catch((err) => {console.log(err);});
        }

        

        callback(report);
    },

    // Prepare the response according to the given questions
    prepareResponse: async function(doc, qes, paraArray, report){
        let area = qes.area;
        let subarea = qes.subarea.split(',');
        let usedValue = qes.usedValue;
        let result = {};
        let total = 0;
        let responseQT = "null";
        let usableValue = [];

        subarea.forEach(t => {
            let array;
            area === ""? array = null : array = doc[area][t];
            let analysisArray = array;
            switch(area) {
                case "prolangmatch" :
                    analysisArray = { key : "" , words : array};
                    if(array.includes(usedValue)){
                        let len = array.length - 1;
                        if(len > 0){
                            responseQT = "coderel";
                            array.forEach(w => {
                                if(w != usedValue){usableValue.push(w);}
                            });
                        } else {
                            responseQT = "badcode";
                            usableValue = doc[area]["unmatch"];
                        }
                    }
                    break;
                case "jobdeskeywords" :
                    responseQT = "companyrel"; 
                    break;
            }
            if(area === ""){
                report["summary"] = {
                    "newMention": paraArray.length,
                };
            } else {
                this.KeywordsSimilar(paraArray, analysisArray, (r) => {
                    let gcount = 0;
                    if(r.keysim > 0.75){
                        gcount = gcount + 1;
                    }
                    for(var k in r.keywordssim){
                        if(r.keywordssim[k] > 0.75){
                            gcount = gcount + 1;
                            total = total + 1;
                        }
                    }

                    let tempJ = {};
                    let sort = r.keywordssim.sort();
                    let len = paraArray.length;
                    let temp = [];
                    for(let i = 0; i < len ; ++i){
                        temp.push(sort[sort.length - i - 1]);
                    }
                    let mean = parseFloat(mathjs.mean(temp).toFixed(3));  
                    tempJ["max"] = mathjs.max(sort);
                    tempJ["mean"] = mean;
                    tempJ["goodCount"] = gcount;
                    result[t] = tempJ;
                });
                // Analysis the result of the similarity report
                let tempGp = 0;
                let tempG = "";

                for(var r in result){
                    if(result[r].goodCount > tempGp){
                        tempG = r;
                        tempGp = result[r].goodCount;
                    }
                }

                report["similarityReport"] = result;
                report["summary"] = {
                    "bestTopic" : tempG,
                    "bestTopicPoint" : tempGp,
                    "totalPoint" : total
                }
            }
        });

        report["followUpQ"] = this.generateFQ(responseQT, usableValue);

        return report;
    },

    generateFQ: function(responseQT,usableValue){
        let length = QuestionSet[responseQT].length;
        let question = QuestionSet[responseQT][this.getRandomInt(length)];
        let replace = "";
        
        if(usableValue.length > 0 && question.indexOf("#") > -1){
            replace = usableValue[this.getRandomInt(usableValue.length)];
            question = question.replace("#",replace);
        }

        return question;
    },

/*  getParaWSyno: async function (lines, callback){
        let resultPara = [];
        let slicePara = [];
        let resultSyno = [];
        let result = {};
        
        resultPara = await this.wordsSplitArray(lines);
        resultPara.forEach(w => {
            let s = synonyms(w);
            if(s == null){
                console.log(w);
                let index = resultPara.indexOf(w);
                slicePara.push(index);
            } else {
                s["original"] = w;
                resultSyno.push(s);
            }
        });

        let temp = [];
        let remove = [];

        if(slicePara.length > 0){                    
            await slicePara.forEach(i => {
                remove.push(resultPara[i]);
                resultPara[i] = "";
            });
            resultPara.forEach(w => {
                if(w == ""){

                } else {
                    temp.push(w);
                }
            });
        }
        

        result["parameters"] = temp;
        result["synonyms"] = resultSyno;
        result["remove"] = remove;

        callback(result);
    }*/
    //#endregion
}