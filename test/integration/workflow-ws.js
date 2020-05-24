'use strict';

const chai = require('chai');
const assert = chai.assert;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const WebSocket = require('ws');
const U = require('../utils.js');

let u1, u2;
const msgEcho = JSON.stringify({type:"echo", msg:"hi bruh"});
const msgAllUserData = {
  type: "userData",
  user: U.userFooB, // version B has username instead of nickname...
  description: "allUserData"
};
const msgSendAtlas = {
  type: "userData",
  description: "sendAtlas"
};
let mri;

describe('TESTING WEBSOCKET WORKFLOW', function () {
  before( function () {
    u1 = new WebSocket('wss://localhost:8080');
    u2 = new WebSocket('wss://localhost:8080');
  });

  after( function () {
    u1.close();
    u2.close();
  });

  describe('WS connection', function () {
    it('Can create a WS connection', (done) => {
      u1.on('open', function () {
        done();
      });
    });

    it('Can send little data', (done) => {
      u1.send(msgEcho);
      done();
    });

    it('Can trigger a data download', async function () {
      // check that data is not already there
      let res = await chai.request(U.serverURL).get('/mri/json')
        .query({url: U.localBertURL});
      assert(res.statusCode === 404, "Unexpected status code");

      // trigger download
      res = await chai.request(U.serverURL).post('/mri/json')
        .send({url: U.localBertURL, token: U.testToken + U.userFoo.nickname});
      const {body} = res;
      assert(body.success === "downloading");

      // wait until getting the data, and check it's ok
      await U.delay(U.shortTimeout);
      res = await chai.request(U.serverURL).get('/mri/json')
        .query({url: U.localBertURL});
      mri = res.body;
      assert(mri.success === true, "Unexpected MRI structure");
    }).timeout(U.mediumTimeout);

    it('Can send larger data', (done) => {
      msgAllUserData.user.dirname = mri.url;
      msgAllUserData.user.mri = mri.mri.brain;
      msgAllUserData.user.atlasFilename = mri.mri.atlas[0].filename;
      msgAllUserData.user.source = mri.source;
      u1.send(JSON.stringify(msgAllUserData));
      done();
    });

    it('Can request data', (done) => {
      u1.send(JSON.stringify(msgSendAtlas));
      done();
    });

    it('Can receive data', (done) => {
      u1.on('message', (data) => {
        if(Buffer.isBuffer(data)) {
          assert(true);
        } else {
          data = JSON.parse(data);
          assert(data.type === "vectorial");
        }
        done();
      });
    }).timeout(U.longTimeout);

    it('Remove test MRI from db and disk', async function () {
      const res = await chai.request(U.serverURL).get('/mri/json')
        .query({
          url: U.localBertURL
        });
      const {body} = res;
      const dirPath = "./public" + body.url;
      await U.removeMRI({dirPath, srcURL: U.localBertURL});
    });
  });
});
