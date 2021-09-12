"use strict";

const fs = require("fs");
const path = require("path");
const { Sequelize } = require("sequelize");
const ck = require("ckey");
const { SecretManagerServiceClient } = require("@google-cloud/secret-manager");
const client = new SecretManagerServiceClient();
const basename = path.basename(__filename);
const db = {};
let DB_PASSWORD = "";
let DB_NAME = "curriculum";
let DB_USER = "root";

async function accessSecretVersion() {
  const [version] = await client.accessSecretVersion({
    name: `projects/535449783252/secrets/DB_PASSWORD/versions/latest`,
  });
  DB_PASSWORD = version.payload.data.toString();
  console.info(`Payload: ${DB_PASSWORD}`);
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  dialect: "mysql",
  logging: false,
  host: "35.185.226.126",
  port: "3306",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

sequelize.beforeConnect(async (config) => {
  const waitForIt = await accessSecretVersion(DB_PASSWORD);
  config.password = DB_PASSWORD;
});

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
