var express = require('express');
var app = express();
var os = require('os');
var http = require('http');
var fs = require('fs');
var resultFile = 'result.txt';
var httpReq = require('request');

var KEY_API = '/v3/Coupon/GetAuthKey?callback=callback&authkey=&_=${t}';

var MONEY_API = '/v3/Coupon/GetBriberyMoney?callback=callback&authkey=${key}&_=${t}';

app.get('/', function (req, res) {
    res.send('Hello World');
});

var options = {
    pro: 'http://',
    hostname: 'dealer.api.00bang.net',
    port: 80,
    method: 'GET',
    path: '',
    handers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.64 Safari/537.11',
        'X-Forwarded-For': '10.111.198.90'
    }
};

var count = 0;
var authkey = '';
var pending = false;

var callback = function (data) {
    return data;
};

var saveData = function (data) {
    fs.writeFile(resultFile, '\n' + new Date().toLocaleString() + '' + data, {
        flag: 'a'
    }, function (err) {
        if (err) {
            console.log(err);
        }
    });
};


var getKey = function (cb) {
    var t = new Date().getTime();
    options.path = KEY_API.replace('${t}', t + '');
    options.url = options.pro + options.hostname + options.path;
    console.log('getKey');
    httpReq(options, function (error, response, body) {
        if (!error && response.statusCode == '200') {
            var data = eval(body);
            console.log(data);
            if (data && data.state === 'success') {
                if (data.data && data.data.Cookie) {
                    authkey = data.data.Cookie;
                    count = 3;
                    cb && cb();
                } else {
                    console.log(body);
                    pending = false;
                }
            } else {
                console.log(body);
                pending = false;
            }
        } else {
            console.log(error);
            pending = false;
        }
    })
};

var getMoney = function () {
    var t = new Date().getTime();
    options.path = MONEY_API.replace('${t}', t + '').replace('${key}', authkey);
    options.url = options.pro + options.hostname + options.path;
    console.log('getMoney');
    httpReq(options, function (error, response, body) {
        if (!error && response.statusCode == '200') {
            var data = eval(body);
            if (data && data.state === 'success') {
                data.authkey = authkey;
                if (data.data.CouponValue && data.data.CouponValue >= 588) {
                    saveData(JSON.stringify(data));
                }
                console.log(data);
            } else {
                console.log(body);
            }
        } else {
            console.log(error)
        }
        count--;
        pending = false;
    })
};
function rnd(start, end) {
    return Math.floor(Math.random() * (end - start) + start);
}

var genIpAddress = function () {
    return rnd(1, 61) + '.' + rnd(169, 190) + '.' + rnd(1, 255) + '.' + rnd(1, 255);
}

var start = function () {
    if (!pending) {
        console.log('start');
        pending = true;
        if (count <= 0) {
            options.handers['X-Forwarded-For'] = genIpAddress();
            getKey(getMoney);
        } else {
            getMoney();
        }
    }
};


var server = app.listen(9000, function () {
    setInterval(start, 10000);
});