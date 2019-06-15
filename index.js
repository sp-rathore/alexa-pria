'use strict';

var http = require('http');
var https = require('https');

exports.handler = function(event,context) {

  try {

    if(process.env.NODE_DEBUG_EN) {
      console.log("Request:\n"+JSON.stringify(event,null,2));
    }



    var request = event.request;
    var session = event.session;

    if(!event.session.attributes) {
      event.session.attributes = {};
    }

    if (request.type === "LaunchRequest") {
      handleLaunchRequest(context);

    } else if (request.type === "IntentRequest") {

      if (request.intent.name === "HelloIntent") {
        handleHelloIntent(request,context);

      } else if (request.intent.name === "QuoteIntent") {
        handleQuoteIntent(request,context,session);

      } else if (request.intent.name === "NextQuoteIntent") {
        handleNextQuoteIntent(request,context,session);

      } else if (request.intent.name === "AboutPFG") {
        handleAboutPFG(request,context);

      } else if (request.intent.name === "PrincipalCEO") {
        handlePrincipalCEO(request,context);

      } else if (request.intent.name === "StockQuoteIntent") {
        handleStockQuoteIntent(request,context,session);

      } else if (request.intent.name === "HighLowStockQuote") {
        handlehighlowstockquote(request,context,session);

      } else if (request.intent.name === "NewsIntent") {
        handleNewsIntent(request,context);

      } else if (request.intent.name === "financialReportIntent") {
        handleFinancialReportIntent (request,context);

      } else if (request.intent.name === "dividendIntent") {
        handleDividendIntent(request,context);

      } else if (request.intent.name === "earningsIntent") {
        handleEarningsIntent(request,context);

      } else if (request.intent.name === "PeerIntent") {
        handlePeerIntent(request,context);

      } else if (request.intent.name === "AMAZON.StopIntent" || request.intent.name === "AMAZON.CancelIntent") {
        context.succeed(buildResponse({
          speechText: "Good bye. ",
          endSession: true
        }));

      } else {
        throw "Unknown intent";
      }

    } else if (request.type === "SessionEndedRequest") {

    } else {
      throw "Unknown intent type";
    }
  } catch(e) {
    context.fail("Exception: "+e);
  }

};

function getQuote(callback) {
  var url = "http://api.forismatic.com/api/1.0/json?method=getQuote&lang=en&format=json";
  var req = http.get(url, function(res) {
    var body = "";

    res.on('data', function(chunk) {
      body += chunk;
    });

    res.on('end', function() {
      body = body.replace(/\\/g,'');
      var quote = JSON.parse(body);
      callback(quote.quoteText);
    });

  });

  req.on('error', function(err) {
    callback('',err);
  });
  
}

function getWish() {
  var myDate = new Date();
  var hours = myDate.getUTCHours() + 5.30;
  if (hours < 0) {
    hours = hours + 24;
  }

  if (hours < 12) {
    return "Good Morning. ";
  } else if (hours < 18) {
    return "Good afternoon. ";
  } else {
    return "Good evening. ";
  }
  
}

function buildResponse(options) {

  if(process.env.NODE_DEBUG_EN) {
    console.log("buildResponse options:\n"+JSON.stringify(options,null,2));
  }

  var response = {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "PlainText",
        text: options.speechText
      },
      shouldEndSession: options.endSession
    }
  };

  if(options.repromptText) {
    response.response.reprompt = {
      outputSpeech: {
        type: "PlainText",
        text: options.repromptText
      }
    };
  }

  if(options.session && options.session.attributes) {
    response.sessionAttributes = options.session.attributes;
  }

  if(process.env.NODE_DEBUG_EN) {
    console.log("Response:\n"+JSON.stringify(response,null,2));
  }

  return response;
}

function handleLaunchRequest(context) {
  let options = {};
  options.speechText =  "Hello. My name is Eddie, I can help you updating on Principal Financial Group. ";
  options.speechText += "Also I can read you a motivational quote. ";
  options.repromptText = "You can say for example, say hello to John. ";
  options.endSession = false;
  context.succeed(buildResponse(options));
}

function handleHelloIntent(request,context) {
  let options = {};
  let name = request.intent.slots.FirstName.value;
  options.speechText = "Hello " + name + ". ";
  options.speechText += getWish();

  getQuote(function(quote,err) {
    if(err) {
      context.fail(err);
    } else {
      options.speechText += quote;
      options.endSession = true;
      context.succeed(buildResponse(options));
    }
  });
}

function handleQuoteIntent(request,context,session) {
  let options = {};
  options.session = session;

  getQuote(function(quote,err) {
    if(err) {
      context.fail(err);
    } else {
      options.speechText = quote;
      options.speechText += " Do you want to listen to one more quote? ";
      options.repromptText = "You can say yes or one more. ";
      options.session.attributes.quoteIntent = true;
      options.endSession = false;
      context.succeed(buildResponse(options));
    }
  });

}

function handleNextQuoteIntent(request,context,session) {
  let options = {};
  options.session = session;

  if(session.attributes.quoteIntent) {
    getQuote(function(quote,err) {
      if(err) {
        context.fail(err);
      } else {
        options.speechText = quote;
        options.speechText += " Do you want to listen to one more quote? ";
        options.repromptText = "You can say yes or one more. ";
        options.endSession = false;
        context.succeed(buildResponse(options));
      }
    });
  } else {
    options.speechText = " Wrong invocation of this intent. ";
    options.endSession = true;
    context.succeed(buildResponse(options));
  }

}

function getdetails(tag,callback) {
  var url = "https://api.iextrading.com/1.0/stock/PFG/" + tag;
  var req = https.get(url, function(res) {
    var body = "";

    res.on('data', function(chunk) {
      body += chunk;
    });

    res.on('end', function() {
      body = body.replace(/\\/g,'');
      var details = JSON.parse(body);
      callback(details);
      //callback(details.description);
    });

  });

  req.on('error', function(err) {
    callback('',err);
  });
  
}

function handleAboutPFG(request,context) {
  let options = {};
  let tag = "company";

  getdetails(tag,function(details,err) {
    if(err) {
      context.fail(err);
    } else {
      var desc = details.description;
      var ceo = details.CEO;
      options.speechText = desc + " ";
      options.speechText += "Current CEO of Principal Financial Group is " + ceo + ". ";
      options.endSession = true;
      context.succeed(buildResponse(options));
    }
  });

}

function handlePrincipalCEO(request,context) {
  let options = {};
  let tag = "company"

  getdetails(tag,function(details,err) {
    if(err) {
      context.fail(err);
    } else {
      var ceo = details.CEO;
      options.speechText = "Current Chairman of Principal Financial Group is " + ceo + ". ";
      options.endSession = true;
      context.succeed(buildResponse(options));
    }
  });

}

function handleStockQuoteIntent(request,context,session) {
  let options = {};
  let tag = "quote";

  getdetails(tag,function(details,err) {
    if(err) {
      context.fail(err);
    } else {
      var date = details.latestTime;
      var latestprice = details.latestPrice;
      var open = details.open;
      options.speechText = "As on " + date + " latest stock price of PFG is $" + latestprice;
      options.speechText += " with an opening day price of $" + open;
      //options.repromptText = "Do you want to know 52 weeks high and low stock price of Principal? You can say Yes ";
      options.endSession = true;
      context.succeed(buildResponse(options));
    }
  });  

}

function handlehighlowstockquote(request,context,session) {
  let options = {};
  let tag = "quote";

  getdetails(tag,function(details,err) {
      if(err) {
        context.fail(err);
      } else {
        var high = details.week52High;
        var low = details.week52Low;
        options.speechText = "52 week high stock price is $" + high;
        options.speechText += " and 52 week low is $" + low;
        options.endSession = true;
        context.succeed(buildResponse(options));
      }
    });

}

function handleNewsIntent(request,context) {
  let options = {};
  let tag = "news";
  let occr;

  getdetails(tag,function(details,err) {
    if(err) {
      context.fail(err);
    } else {
      for (occr in details) {
        var item = details[occr];
        var source = item.source;
        var headline = item.headline;
        var summary = item.summary;
        options.speechText = "News update from source " + source + ". ";
        options.speechText += headline + ". ";
        options.speechText += summary;
        
      } 
      options.endSession = false;
      context.succeed(buildResponse(options));  
    }
  });  

}

function handleFinancialReportIntent(request,context) {
  let options = {};
  let tag = "financials";
  let occr;

  getdetails(tag,function(details,err) {
    if(err) {
      context.fail(err);
    } else {
      var report = details.financials;
      for (occr in report) {
        var item = report[occr];
        var date = item.reportDate;
        var totrevenue = item.totalRevenue;
        var netIncome = item.netIncome;
        var totAsset = item.totalAssets;
        var totliability = item.totalLiabilities;
        var shrholdeq = item.shareholderEquity;
        options.speechText = "Reading financial report as on " + date + ". ";
        options.speechText += "Total revenue generated is $" + totrevenue + ". ";
        options.speechText += "Net income amount is $" + netIncome + ". ";
        options.speechText += "Total asset amount is $" + totAsset + ". ";
        options.speechText += "Total liabilities is $" + totliability + ". ";
        options.speechText += "Total share holder Equity amount is $" + shrholdeq + ". "; 
        options.endSession = true;
        context.succeed(buildResponse(options));
      }   
    }
  });  

}

function handleDividendIntent(request,context) {
  let options = {};
  let tag = "dividends/3m";
  let occr;

  getdetails(tag,function(details,err) {
    if(err) {
      context.fail(err);
    } else {
      for (occr in details) {
        var item = details[occr];
        var declareddate = item.declaredDate;
        var amount = item.amount;
        var type = item.type;
        var qualified = item.qualified;
        var qualifiedText;

        if (qualified === "Q") {
          qualifiedText = "Qualified Income"; 
        } else if (qualified === "P") {
          qualifiedText = "Partially qualified income";
        } else if (qualified === "N") {
          qualifiedText = "Unqualified income";
        }

        options.speechText = "Reading dividend report declared as on " + declareddate + ". ";
        options.speechText += "Payment amount is $" + amount + ". ";
        options.speechText += "This is the " + type + " paid towards " + qualifiedText + ". ";
        
        options.endSession = true;
        context.succeed(buildResponse(options));
      }   
    }
  });  

}

function handleEarningsIntent(request,context) {
  let options = {};
  let tag = "earnings";
  let occr;

  getdetails(tag,function(details,err) {
    if(err) {
      context.fail(err);
    } else {
      var earnings = details.earnings;
      for (occr in earnings) {
        var item = earnings[occr];

        var fiscalPeriod = item.fiscalPeriod;
        var EPSReportDate = item.EPSReportDate;
        var actualEPS = item.actualEPS;
        var consensusEPS = item.consensusEPS;
        var EPSSurpriseDollar = item.EPSSurpriseDollar;
        var yearAgo = item.yearAgo;

        options.speechText = "Reading earnings report declared for the quarter " + fiscalPeriod + " reported as on " + EPSReportDate + ". ";
        options.speechText += "Actual earnings per share amount is $" + actualEPS + " with a consensus earnings per sharing value of $" + consensusEPS + ". ";
        options.speechText += "Earnings per share surprise value for the period is $" + EPSSurpriseDollar + ". ";
        options.speechText += "EPS reported for the same quarter a year ago was $" + yearAgo + ". ";
        options.endSession = true;
        context.succeed(buildResponse(options));
      }   
    }
  });  

}

function handlePeerIntent(request,context) {
  let options = {};

  options.speechText = "Peer companies of Principal financial group are ";
  options.speechText += "MetLife Inc, Prudential Financial Inc, Aflac Inc and Fidelity Investments";
  options.endSession = true;
  context.succeed(buildResponse(options));  
}


function getcompanyname(tag,callback) {
    var url = "https://api.iextrading.com/1.0/stock/" + tag + "/company";
    var req = https.get(url, function(res) {
    var body = "";

    res.on('data', function(chunk) {
      body += chunk;
    });

    res.on('end', function() {
      body = body.replace(/\\/g,'');
      var name = JSON.parse(body);
      callback(name);
    });

  });

  req.on('error', function(err) {
    callback('',err);
  });
}