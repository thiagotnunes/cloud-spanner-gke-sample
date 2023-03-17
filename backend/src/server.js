/*
Copyright 2023 Google LLC
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    https://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 8080;

// Configures the Cloud Spanner client
const {Spanner} = require('@google-cloud/spanner');
const spanner = new Spanner({projectId: process.env.GOOGLE_CLOUD_PROJECT_ID});
const instance = spanner.instance(process.env.CLOUD_SPANNER_INSTANCE || 'hello-instance');
const database = instance.database(process.env.CLOUD_SPANNER_DATABASE || 'hello-database');

//Serve website
app.use(express.static(path.join(__dirname, "..", "public")));

//Get all singers
app.get("/api/singers", async (req, res) => {
  const [rows] = await database.run("SELECT * FROM Singers");
  res.send(rows);
});

//Get singer by id
app.get("/api/singers/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(422).send({ error: `Invalid SingerId ${id}` });
    return;
  }

  const query = {
    sql: "SELECT * FROM Singers WHERE SingerId = @id",
    params: { id }
  };
  const rows = await database.run(query);

  if (rows[0].length === 0) {
    res.status(404).send({ error: `SingerId ${id} not found`});
    return;
  }

  res.send(rows[0]);
});

//Client side routing fix on page refresh or direct browsing to non-root directory
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"), (err) => {
    if (err) {
      res.status(500).send(err);
    }
  });
});

//Start the server
app.listen(port, () => console.log(`App listening on port ${port}!`));

