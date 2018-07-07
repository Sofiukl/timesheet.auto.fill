let request = require('request');
const credentials = require('./credentials.json');
const restEndPoint = require('./rest.endpoint.config');
const moment = require('moment');
var entryInfo = require('./log-info.json');

var baseHeader = {
    "Accept" :  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" ,
    "Accept-Language" :  "en-US,en;q=0.5" ,
    "User-Agent" : "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:42.0) Gecko/20100101 Firefox/42.0" ,
};

/**
 * request options
 * <li> homePageOptions : This is for opening home page of the application </li>
 * <li> logInOptions : This is for log in to appl</li>
 * <li> contentOptions : This is for fetching content of this month </li>
 * <li> addMissingEntryOptions : This is for adding missing entry for this month </li>
 */
var homePageOptions = {
    url : restEndPoint.BASE+restEndPoint.HOME_PAGE_URL , headers : baseHeader
};
  
const logInOptions = {
    url: restEndPoint.BASE + restEndPoint.LOG_IN_URL,
    form : {
        "username": credentials.username,
        "password": credentials.password,
        'targetUri' : '/'
    },
    headers : baseHeader
};

const contentOptions = {
    url: restEndPoint.BASE + restEndPoint.FETCH_CONTENT_URL,
    headers : baseHeader
};


request = request.defaults({jar: true , followAllRedirects: true});

let printError = (err) => {
    if(err){
        console.log(err);
    }
}
/**
 * Responsibility of this method are -
 * 1. Find the logged entries
 * 2. Entry for today or Add for specified date
 * 
 * Format for specifying date is YYYY-MM-DD
 */
let main = async () => {

  request.get(homePageOptions, (err, res, loginBody) => {

        request.post(logInOptions, (err, res, loginbody) => {

            printError(err);
            request.post(contentOptions, (err, res, contentbody) => {
                printError(err);
                const content = JSON.parse(contentbody);
                analyzeData(content.invdata);
            })
        })

    })
}
/**
 * analyzes the current entries and display
 * 
 * @param {*data} timesheet data
 */
let analyzeData = (data) => {
    
    let dates = [];
    let entries = [];
    
    if(! data || data.length == 0){
        console.log('No entry present for this month..')
    }else {
        data.forEach(entry => {
            dates.push(entry.cell[3]);

            entries.push( {
                'dbid' : entry.cell[0]+"" ,
                'msgid' : entry.cell[1]+"",
                'id' : entry.cell[2]+"" ,
                'date' :  entry.cell[3]+"",
                "Activity" : entry.cell[4]+"" ,
                'Project' : entry.cell[5]+"",
                'Hour' : entry.cell[6]+"",
                'delid' : '' 
            } )
        });
    }

    console.log('below dates are logged: ');
    console.log(dates);

    if(!process.argv[2]){
        addMissingEntryOptions(entries);
    }else {
        const myDate = moment(process.argv[2], 'YYYY-MM-DD').toDate();
        addMissingEntryOptions(entries, myDate);
    }
}

/**
 * The below functino is used to add
 * missingDate passed in the functino argumnet in your timesheet entry
 * 
 * Default value is todays date
 */
let addMissingEntryOptions = (entries, missingDate = new Date()) => {

    let missingDateStr =  moment(missingDate).format("DD-MM-YYYY");
    console.log(`Adding entry : ${missingDateStr}`)
    entries.unshift({
        'dbid' : "" ,
        'msgid' : "",
        'id' : (entries.length+1)+"" ,
        'date' :  missingDateStr,
        "Activity" : 'Service' ,
        'Project' : entryInfo.project,
        'Hour' : entryInfo.hours,
         "delid":"&nbsp;<div class=\"left deleteBtn\"></div>"
        
      });
    
    var entriesStr = JSON.stringify(entries);
    
    const addMissingEntryOptions = {
        url: restEndPoint.BASE + restEndPoint.ADD_ENTRY_URL,
        json: true,
        form : {
        'mydata' : entriesStr
        } ,
        headers : baseHeader
    };

    request.post(addMissingEntryOptions, (err, httpRes, body) => {
        console.log(`operation status: ${httpRes.statusCode}`);
        console.log(`Response Message: ${body.genmsg}`);
    })
}

main();
