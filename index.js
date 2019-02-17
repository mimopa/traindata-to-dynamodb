const AWS = require('aws-sdk');
const fetch = require('node-fetch');
const fetchJson = require('fetch-json');
const docClient = new AWS.DynamoDB.DocumentClient();

// 日付のフォーマット dateformatかmomentか
const moment = require('moment-timezone');

// nullもしくはundefined以外の場合、データに含まれる不要な文字列を削除する。
function nvl(val1, val2){
  // undefined or nullの判定
//   return (val1 == null)?null:val1.replace(val2,'');
  if (Array.isArray(val1)) {
      return (val1[0] == null)?null: (typeof val1[0] === 'string')?val1[0].replace(val2,''):val1[0];
  } else {
      return (val1 == null)?null: (typeof val1 === 'string')?val1.replace(val2,''):val1;
  }
//   return (val1 == null)?null: (typeof val1 === 'string')?val1.replace(val2,''):val1;
}

exports.handler = async (event, context, callback) => {
    const tableName = 'train';
    const conshumerKey = process.env.CONSHUMER_KEY;
    const contentType = 'application/json';
    const targetKey = 'Train';
    const targetKeys = ['Train', 'TrainInformation', 'Bus', 'FlightInformationArrival', 'FlightInformationDeparture'];
    const getDate = moment().tz('Asia/Tokyo').format('YYYY-MM-DD_HH-mm-ss');
    let data = await fetchJson.get(`https://api-tokyochallenge.odpt.org/api/v4/odpt:${targetKey}?acl:consumerKey=${conshumerKey}`);

    data.forEach(item => {
        
        // DynamoDBへの格納
        var params = {
            TableName : tableName,
            Item: {
                id: item['@id'].replace('urn:uuid:', ''),
                // date: item['dc:date'],
                // 日付のフォーマット
                date: moment(new Date(item['dc:date'])).tz('Asia/Tokyo').format('YYYY-MM-DD HH:mm:ss'),
                delay: item['odpt:delay'],
                sameAs: item['owl:sameAs'].replace('odpt.Train:', ''),
                operator: item['odpt:operator'].replace('odpt.Operator:', ''),
                railway: item['odpt:railway'].replace('odpt.Railway:', ''),
                railDirection: item['odpt:railDirection'].replace('odpt.RailDirection:', ''),
                trainNumber: item['odpt:trainNumber'],
                trainType: nvl(item['odpt:trainType'],'odpt.TrainType:'),
                fromStation: item['odpt:fromStation'].replace('odpt.Station:', ''),
                toStation: nvl(item['odpt:toStation'],'odpt.Station:'),
                originStation: nvl(item['odpt:originStation'],'odpt.Station:'),
                // destinationStation: item['odpt:destinationStation'][0].replace('odpt.Station:', ''),
                destinationStation: nvl(item['odpt:destinationStation'],'odpt.Station:'),
                carComposition: item['odpt:carComposition']
            }
        };
        
        docClient.put(params, function(err, data) {
            if (err) {
                console.log('err!!!!!!',err);
                callback(err);
            } else {
                // console.log('end!!!!!!');
                callback(null, data);
            }
        });
    });
};
