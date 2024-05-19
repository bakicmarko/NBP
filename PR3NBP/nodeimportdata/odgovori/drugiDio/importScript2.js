const { MongoClient } = require("mongodb");
const { getSystemErrorMap } = require("util");
const { execSync } = require("child_process");

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

  // cut down the size of data for performance issues or for debug purposes
  //
  // chSize = 2;
  // result = result.slice(0, result.length / 2);
  // --

  // break into arrays of 100 or less
  for (let i = 0; i < result.length; i += chSize) {
    chunks.push(result.slice(i, i + chSize));
  }
  console.log("Number of documents: " + result.length);
  // console.log(chunks.length);
  // console.log(chunks[chunks.length - 1].length);
} catch (e) {
  console.log(e.stack);
}

// handling connection code from: https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/
// Connection URI
const uri =
  "mongodb://127.0.0.1:10001,127.0.0.1:10002,127.0.0.1:10003,127.0.0.1:10004,127.0.0.1:10005/?replicaSet=myrplset2";
// Create a new MongoClient
const client = new MongoClient(uri);
async function run(repetitions, writeCon) {
  try {
    // connect
    await client.connect();
    // get database and collection (create if non-existing)
    var coll = await client.db("pr3part2").collection("test123");
    var timings = [];

    for (let i = 0; i < repetitions; i++) {
      const start = Date.now();
      for (let i = 0; i < chunks.length; i++) {
        const instMany = await coll.insertMany(chunks[i], {
          writeConcern: writeCon,
        });
      }
      const end = Date.now();

      // delete added _id property from insertMany, for the next loop
      if (repetitions > 1)
        chunks.forEach((ch) => ch.forEach((doc) => delete doc._id));

      timings.push(end - start);
      console.log(`Execution time: ${end - start} ms`);
    }
    console.log(timings);
    const averageTiming = timings.reduce((a, b) => a + b, 0) / timings.length;
    const sz = (chunks.length - 1) * chSize + chunks[chunks.length - 1].length;
    console.log(
      "Average timing for " +
        sz +
        " documents: " +
        averageTiming +
        " with write concern: " +
        writeCon
    );
    console.log("Standard deviation: " + standardDev(timings));
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
  }
}

run(10, 0)
  .then(() => {
    // console.log("First iteration done...");
    //execSync("sleep 5");
    //run(10, 0);
    require("child_process").exec("powershell.exe [console]::beep(500,600)");
  })
  .catch(console.dir);

// run(10, 5).catch(console.dir);

// helper function for calculatig standard deviation from array of numbers
function standardDev(input) {
  let mean =
    input.reduce((acc, curr) => {
      return acc + curr;
    }, 0) / input.length;
  input = input.map((k) => {
    return (k - mean) ** 2;
  });
  let sum = input.reduce((acc, curr) => acc + curr, 0);
  let variance = sum / input.length;
  let std = Math.sqrt(variance);
  return std;
}
