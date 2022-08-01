
const { promises: fs } = require('fs');
var kmeans = require('../ML/kmean.js');
var fss = require('fs');
const { result, gram, nan } = require('synonyms/dictionary');


// Get target cell from csv
function getCol(matrix, col, col2) {
    var column = [];
    for (var i = 0; i < matrix.length; i++) {
        column.push(matrix[i][col], matrix[i][col2]);
    }
    return column;
}
function getCol1(matrix, col) {
    var column = [];
    for (var i = 0; i < matrix.length; i++) {
        column.push(matrix[i][col]);
    }
    return column;
}
// compare array
function arrayEquals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, index) => val === b[index]);
}

//get user data from firebase
function writerecord(report) {

    var total_mention = 0;
    var good_point = 0;
    var average_Similar = 0
    var greatest_Similar = 0
    var flag = true

    Object.keys(report.summary.topicmetiontimes).forEach(function (key) {
        total_mention += report.summary.topicmetiontimes[key];
    });


    Object.keys(report.summary.goodCount).forEach(function (key) {
        good_point += report.summary.goodCount[key];
    });
    Object.keys(report.summary.averageSimilar).forEach(function (key) {
        average_Similar += report.summary.averageSimilar[key];
    });
    average_Similar = average_Similar / Object.keys(report.summary.averageSimilar).length
    Object.keys(report.summary.greatestSimilar).forEach(function (key) {
        greatest_Similar += report.summary.greatestSimilar[key];
    });
    greatest_Similar = greatest_Similar / Object.keys(report.summary.greatestSimilar).length

    // console.log(greatest_Similar);
    ///   console.log(average_Similar);

    records = {
        name: 'tim',
        wordCount: report.summary.wordCount,
        estSpeechTime: report.summary.estSpeechTime,
        mistakeCount: report.summary.mistakeCount,
        totalmention: total_mention,
        goodpoint: good_point,
        averageSimilar: average_Similar,
        greatestSimilar: greatest_Similar,
        avgSentScore: report.summary.avgSentScore,
        maxSentScore: report.summary.maxSentScore,

    };

    return records


}
//find the position
async function find_centroid(dataset, target) {
    grammar_cen = []
    grammar_count = 0
    let grammar_result = await kmeans.kmeans(dataset, 5)
    //console.log(grammar_result);
    for (let cluster of grammar_result.clusters) {

        for (let point of cluster.points) {
            //console.log(cluster )
            //console.log("+" + point);
            if (arrayEquals(point, target)) {
                //console.log("target " + target);
                //console.log(cluster)
                grammar_cen = cluster.centroid
                break;
            }
        }
    }
    //console.log(grammar_cen);
    var temp = grammar_result.centroids.sort(function (a, b) {
        return a[0] - b[0];
    });
    //console.log(temp);
    for (let cluster of temp) {
        grammar_count += 1
        if (arrayEquals(grammar_cen, cluster)) {
            break;
        }
    }
    return grammar_count

}

async function ratio_con(numbers) {



    l = numbers.length
    for (var i = 0; i < l; i++) {
        numbers[i] = Math.abs(numbers[i] - 80);
    }

    ratio_max = Math.max.apply(Math, numbers)
    ratio_min = Math.min.apply(Math, numbers)

    for (var i = 0; i < l; i++) {
        numbers[i] = (numbers[i] - ratio_min) / (ratio_max - ratio_min);
        //numbers[i] /= ratio_max
    }
    return numbers

}
// calcuate grammar grade
async function cal_grammar(data, user_data2) {
    var user_data = []
    var word_grammar = []
    var grammar_data = []
    var grammar_count = 0
    user_data.push(user_data2['mistakeCount'], user_data2['wordCount'])
    user_data = user_data.map(String)
    // cal grammar
    word_grammar = getCol(data, 3, 1);
    while (word_grammar.length) grammar_data.push(word_grammar.splice(0, 2));
    grammar_data.push(user_data)
    grammar_count = await find_centroid(grammar_data, user_data)    
    grammar_count = 5 - grammar_count
    return grammar_count
}
// calcuate concise grade
async function cal_concise(data, user_data2) {
    var user_data_time = []
    var example_data = []
    var example_concise = []
    var concise_count_pt = 0
    var concise_count_time = 0
    var concise_count = []
    var user_data_pt = []
    var example_data_pt = []
    var example_concise_pt = []
    var concise = 0

    user_data_time.push(user_data2['estSpeechTime'])
    user_data_time = user_data_time.map(String)
    //console.log(data);
    example_data = getCol1(data, 2);

    while (example_data.length) example_concise.push(example_data.splice(0, 1));

    example_concise.push(user_data_time)

    var ratio_concise = await ratio_con(example_concise)
    ratio_concise = ratio_concise.map(String)
    //console.log(ratio_concise);
    if (ratio_concise[ratio_concise.length - 1] <= 0.2) {
        concise_count_time = 5
    } else if (ratio_concise[ratio_concise.length - 1] > 0.2 && ratio_concise[ratio_concise.length - 1] <= 0.4) {
        concise_count_time = 4
    } else if (ratio_concise[ratio_concise.length - 1] > 0.4 && ratio_concise[ratio_concise.length - 1] <= 0.6) {
        concise_count_time = 3
    } else if (ratio_concise[ratio_concise.length - 1] > 0.6 && ratio_concise[ratio_concise.length - 1] <= 0.8) {
        concise_count_time = 2
    } else if (ratio_concise[ratio_concise.length - 1] > 0.8 && ratio_concise[ratio_concise.length - 1] <= 1) {
        concise_count_time = 1
    }
    concise_count.push(concise_count_time)
    //concise_count_time = await find_centroid(ratio_concise,ratio_concise[ratio_concise.length - 1])
    //console.log(concise_count_time);

    /*  concise_count_time = await find_centroid(example_concise,user_data_time)
      if(concise_count_time == 1 || concise_count_time == 5){    
          concise_count.push(1)
      }else if (concise_count_time == 2 || concise_count_time == 4){
          concise_count.push(3)
      }
      else if (concise_count_time == 3){
          concise_count.push(5)
      }*/



    user_data_pt.push(user_data2['goodpoint'], user_data2['totalmention'])
    user_data_pt = user_data_pt.map(String)
    //console.log(user_data_pt);

    example_data_pt = getCol(data, 5, 4);
    while (example_data_pt.length) example_concise_pt.push(example_data_pt.splice(0, 2));
    example_concise_pt.push(user_data_pt)

    concise_count_pt = await find_centroid(example_concise_pt, user_data_pt)


    concise_count.push(concise_count_pt)
    //console.log(concise_count);
    //concise = concise_count.reduce((a,b) => a + b, 0) / concise_count.length
    return concise_count


}
// calcuate accuracy grade
async function cal_accuracy(data, user_data2) {
    var user_data_sim = []
    var example_data_sim = []
    var example_sim = []
    var accuracy_count = 0;
    user_data_sim.push(user_data2['averageSimilar'], user_data2['greatestSimilar'])
    user_data_sim = user_data_sim.map(String)
    example_data_sim = getCol(data, 6, 7);
    while (example_data_sim.length) example_sim.push(example_data_sim.splice(0, 2));
    example_sim.push(user_data_sim)

    //console.log(example_sim);
    accuracy_count = await find_centroid(example_sim, user_data_sim)
    //accuracy_count = 5 - accuracy_count
    return accuracy_count

}
// calcuate polite grade
async function cal_polite(data, user_data2) {
    var user_data_sim = []
    var example_data_sim = []
    var example_sim = []
    var polite_count = 0;
    user_data_sim.push(user_data2['avgSentScore'], user_data2['maxSentScore'])
    user_data_sim = user_data_sim.map(String)
    example_data_sim = getCol(data, 8, 9);
    while (example_data_sim.length) example_sim.push(example_data_sim.splice(0, 2));
    example_sim.push(user_data_sim)
    
    //console.log(example_sim);
    polite_count = await find_centroid(example_sim, user_data_sim)
    //accuracy_count = 5 - accuracy_count
    return polite_count

}
async function ques_analysis(quesanalysis, data) {
    var polite = 0
    var ques_polite = 0
    var polite_len = 0
    var concise = 0
    var concise_good = 0
    var concise_offset = 0
    var grammar_count = 0
    var grammar = 0
    var accuracy_mention = 0
    var accuracy_count = 0
    var accuracy_mean = 0;
    var accuracy = 0
    var concise_array = []
    var concise_data = []
    var ques_concise = []


    //cal question polite
    Object.keys(quesanalysis).filter(v => (v >= 0 && v < (Object.keys(quesanalysis).length - 1))).forEach(function (key) {

        if (quesanalysis[key].summary.avgSentScore != 0) {
            polite_len += 1
            ques_polite += quesanalysis[key].summary.avgSentScore
        }
    });

    var polite_count = ques_polite / polite_len
    if (ques_polite > 0) {
        if (polite_count >= 0.4) {
            polite = 1
        } else if (polite_count < 0.4) {
            polite = -1
        }
    }else{
        polite = -1
    }
    //cal question concise
    Object.keys(quesanalysis).filter(v => (v >= 0 && v < (Object.keys(quesanalysis).length - 1))).forEach(function (key) {


        if (quesanalysis[key].summary.bestTopicPoint != undefined) {
            if (quesanalysis[key].summary.bestTopicPoint > concise_good) {
                concise_good = quesanalysis[key].summary.bestTopicPoint
                concise_offset = quesanalysis[key].summary.wordCount
            }
        }
        //

    });
    console.log(concise_good);
    console.log(concise_offset);
    //console.log("con good"+concise_good) ;

    if (concise_good > 0) {
        concise_array.push(concise_good, concise_offset)
        concise_array = concise_array.map(String)
        concise_data = getCol(data, 10, 11);
        while (concise_data.length) ques_concise.push(concise_data.splice(0, 2));
        ques_concise.push(concise_array)
        concise = await find_centroid(ques_concise, concise_array)
    } else {
        concise = -1
    }
    var wordcount = 0
    // cal question grammar
    Object.keys(quesanalysis).filter(v => (v >= 0 && v < (Object.keys(quesanalysis).length - 1))).forEach(function (key) {

        if (quesanalysis[key].summary.mistakeCount != undefined) {
            if (quesanalysis[key].summary.mistakeCount > 0) {
                grammar_count += quesanalysis[key].summary.mistakeCount
            }
            wordcount += quesanalysis[key].summary.wordCount
            //console.log(quesanalysis[key].summary.mistakeCount); 
        }
        //console.log(quesanalysis[key].similarityReport) ;
    });
    //console.log(grammar_count)
    if (wordcount < 20) {
        grammar = -1
    } else {
        if (grammar_count >= 0 && grammar_count <= 3) {
            grammar = 1
        } else if (grammar_count > 3) {
            grammar = -1
        }
    }
    //cal question accuracy
    Object.keys(quesanalysis).filter(v => (v >= 0 && v < (Object.keys(quesanalysis).length - 1))).forEach(function (key) {

        accuracy_mention += 1
        if (quesanalysis[key].summary.AtoQrelativity > 1) {
            //console.log(quesanalysis[key].similarityReport[count].goodCount)
            accuracy_count += 1

            //console.log(quesanalysis[key].similarityReport) ;
        }

    });
    console.log(accuracy_count)
    console.log(accuracy_mention)
    accuracy_mean = accuracy_count / accuracy_mention
    console.log(accuracy_mean);

    if (accuracy_mean >= 0.4) {
        accuracy = 1
    } else if (accuracy_mean < 0.4) {
        accuracy = -1
    }




    //console.log("acc mean"+ (17/0)) ;
    // console.log("acc count"+accuracy_count) ;


    //console.log(concise);
    var result = {
        grammar: grammar,
        concise: concise,
        accuracy: accuracy,
        polite: polite,
    }
    console.log(result);

    return result

}
function get_area_good(quesanalysis) {
    var area = []
    Object.keys(quesanalysis).filter(v => (v >= 0 && v < (Object.keys(quesanalysis).length - 1))).forEach(function (key) {

        if (quesanalysis[key].key == 5) {
            Object.keys(quesanalysis[key].similarityReport).forEach(function (count) {
                if (quesanalysis[key].similarityReport[count].goodCount > 0) {
                    area.push(count)
                }


            });
            //console.log(quesanalysis[key].similarityReport) ;
        }

    })
    //console.log(area) ;
    return area
}

function get_area_bad(quesanalysis) {
    var area = []
    Object.keys(quesanalysis).filter(v => (v => 0 && v < (Object.keys(quesanalysis).length - 1))).forEach(function (key) {

        if (quesanalysis[key].key == 5) {
            Object.keys(quesanalysis[key].questionPack.subarea).forEach(function (sub_area) {
                area.push(quesanalysis[key].questionPack.subarea[sub_area])

            });
            //console.log(quesanalysis[key].similarityReport) ;
        }

    });
    return area
}


module.exports = {
    //Analysis introdution and Job Desc and Resume and combain them to report 
    analyintrotoreport: async function (user, jobdes, cvtojob, intro, quesanalysis, callback) {
        //get date
        date = new Date();
        dates = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

        //read csv
        var user_data2 = writerecord(intro)
        var data = fss.readFileSync('./ML/FYP_ML_example.csv')
            .toString()
            .split('\n')
            .map(e => e.trim())
            .map(e => e.split(',').map(e => e.trim()));
        first = data.shift()
        data.pop()
        //console.log(data);
        //get the grade

        var grammar_count = 0
        var concise_count = []
        var accuracy_count = 0
        var polite_count = 0
        console.log(user_data2['goodpoint']);
        if (user_data2['wordCount'] < 60 && (user_data2['mistakeCount'] == undefined || user_data2['mistakeCount'] < 2)) {
            grammar_count = 1.5
        } else {
            grammar_count = await cal_grammar(data, user_data2)
        }
        if (user_data2['estSpeechTime'] < 2) {
            concise_count.push(1.5)
        }
        console.log(user_data2['goodpoint']);
        if (user_data2['goodpoint'] == 0) {
            concise_count.push(1)
        } else {
            concise_count = await cal_concise(data, user_data2)
        }
        //console.log(user_data2['averageSimilar']== null);
        if (isNaN(user_data2['averageSimilar'])) {
            accuracy_count = 1.5
        } else {
            accuracy_count = await cal_accuracy(data, user_data2)
        }

        if (user_data2['avgSentScore'] == undefined) {
            polite_count = 1.5
        } else {
            polite_count = await cal_polite(data, user_data2)
        }





        //
        var ques_anal = await ques_analysis(quesanalysis, data)


        //console.log(ques_anal)
        var area = []
        Object.keys(ques_anal).forEach(function (key) {
            //console.log(ques_anal[key])
            if (key == "concise" && ques_anal[key] > 3) {
                area.push(get_area_good(quesanalysis))
                //console.log(key)
            } else if (key == "concise" && ques_anal[key] < 3) {
                area.push(get_area_bad(quesanalysis))
            }
        });


        var introreport = {
            grammar: grammar_count,
            concise: concise_count,
            accuracy: accuracy_count,
            polite: polite_count,
        }
        console.log(introreport);

        var result = {
            date: dates,
            name: user.firstname,
            title: jobdes.title,
            jobduty: jobdes.job_duty,
            intro: introreport,
            ques: ques_anal,
            area: area,

        }
        //console.log(result);
        callback(result)


    },





}