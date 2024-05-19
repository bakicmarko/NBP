const { MongoClient } = require("mongodb");

fs = require("fs");
result = [];
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
  });
} catch (e) {
  console.log(e.stack);
}

// handling connection code from: https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/
// Connection URI
const uri = "mongodb://root:rootnmbp@127.0.0.1:27017/";
const client = new MongoClient(uri);
async function run() {
  try {
    await client.connect();

    var coll = await client.db("nmbp").collection("automotive");
    const collectionToInsert = await coll.insertMany(result);

    console.log(`${collectionToInsert.insertedCount} documents were inserted.`);
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
