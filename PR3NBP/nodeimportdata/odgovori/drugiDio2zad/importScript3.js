const { execSync } = require("child_process");
const { MongoClient } = require("mongodb");

fs = require("fs");
result = [];
chunks = [];
chSize = 100;
try {
  var data = fs.readFileSync("Automotive.txt", "utf8");
  data = data.split(/^\s*$(?:\r\n?|\n)/gm);

  data.forEach((groupOfLines) => {
    if (groupOfLines === "") {
      return;
    }
    groupOfLines = groupOfLines.replace(/^\s*$(?:\r\n?|\n)/gm, "");
    groupOfLines = groupOfLines
      .split("\n")
      .filter((x) => x)
      .map((line) => {
        return line.substring(line.indexOf(" ") + 1);
      });

    if (groupOfLines[2] !== "unknown") {
      var date = new Date(+groupOfLines[7] * 1000);

      var json = {
        product: {
          productId: groupOfLines[0],
          title: groupOfLines[1],
          price:
            groupOfLines[2] !== "unknown" ? parseFloat(groupOfLines[2]) : null,
        },
        review: {
          userId: groupOfLines[3],
          profileName: groupOfLines[4],
          helpfulness: groupOfLines[5],
          score: parseFloat(groupOfLines[6]),
          time: date,
          summary: groupOfLines[8],
          text: groupOfLines[9],
        },
      };
      result.push(json);
    }
  });
} catch (e) {
  console.log(e.stack);
}
//result = result.slice(0, 50);

const groupBy = (array, key) => {
  return array.reduce((result, currentValue) => {
    if (!result[currentValue.product[key]]) {
      result[currentValue.product[key]] = { data: [] };
    }
    //console.log(result);

    result[currentValue.product[key]].data.push(currentValue);
    return result;
  }, {});
};

var res = groupBy(result, "productId");
var jsons = [];
Object.keys(res).forEach((objKey) => {
  prices = [];
  res[objKey].data.forEach((prod) => {
    prices.push(prod.product.price);
  });
  var allEqual = prices.every((v) => v === prices[0]);
  if (!allEqual) {
    delete res[objKey];
  } else {
    res[objKey]["price"] = prices[0];
    res[objKey]["reviews"] = [];
    res[objKey].data.forEach((rv) => res[objKey]["reviews"].push(rv.review));
    delete res[objKey]["data"];

    var json = {
      price: res[objKey]["price"],
      reviews: res[objKey]["reviews"],
    };

    jsons.push(json);
  }
});

const uri = "mongodb://127.0.0.1:27017";
// Create a new MongoClient
const client = new MongoClient(uri);
async function run(isGreater, divider) {
  try {
    // filter data based on price
    console.log("Number of documents befor filtration: " + jsons.length);
    if (isGreater) jsons = jsons.filter((jsn) => jsn.price >= divider);
    else jsons = jsons.filter((jsn) => jsn.price < divider);

    // connect
    await client.connect();
    // get database and collection (create if non-existing)
    var coll = await client.db("pr3dio2zad2").collection("zad2");

    const instMany = await coll.insertMany(jsons);

    console.log(`${instMany.insertedCount} documents were inserted.`);
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

run(true, 20).catch(console.dir);
// run(true, 20).catch(console.dir);
