var express = require('express');
var app = express();
var os = require('os');
var http = require('http');
var fs = require('fs');
var resultFile = 'result.txt';

var KEY_API = '/v3/Coupon/GetAuthKey?callback=callback&authkey=&_=${t}';

var MONEY_API = '/v3/Coupon/GetBriberyMoney?callback=callback&authkey=${key}&_=${t}';

app.get('/', function (req, res) {
    res.send('Hello World');
});

var options = {
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
var pending= false;

var callback = function (data) {
    return data;
};

var saveData = function (data) {
    fs.writeFile(resultFile, '\n' + new Date().toLocaleString() + '' + data, {
        flag: 'a'
    }, function (err) {
        if (err) throw err;
        res.send('ok');
    });
};


var getKey = function (cb) {
    var t = new Date().getTime();
    options.path = KEY_API.replace('${t}', t + '');
    console.log('getKey');
    http.get(options, function (res) {
        console.log(res);
        var data = eval(res);
        console.log(data);
        if (data && data.state === 'success') {
            if (data.data && data.data.Cookie) {
                authkey = data.data.Cookie;
                count = 3;
                cb && cb();
            }
        } else {
            pending = false;
        }
    }).on('error', function (err) {
        pending = false;
        console.log('getKey:');
        console.log(err);
    })
};

var getMoney = function () {
    var t = new Date().getTime();
    options.path = MONEY_API.replace('${t}', t + '').replace('${key}', authkey);
    console.log('getMoney');
    http.get(options, function (res) {
        var data = eval(res);
        if (data && data.state === 'success') {
            data.authkey = authkey;
            if (data.data.CouponValue && data.data.CouponValue >= 588) {
                saveData(JSON.stringify(data));
            }
            count--;
        }
        pending = false;
    }).on('error', function (err) {
        pending = false;
        console.log('getMoney:');
        console.log(err);
    })
};

var start = function () {

    if (!pending) {
        console.log('start');
        pending = true;
        if (count <= 0) {
            getKey(getMoney);
        } else {
            getMoney();
        }
    }
};




var server = app.listen(9000, function () {
    setInterval(start, 3000);
});