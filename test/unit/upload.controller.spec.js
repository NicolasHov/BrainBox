/* eslint-disable no-empty-function */
var assert = require("assert");
const uploadController = require('../../controller/mri/upload.controller');
const monk = require('monk');
require('mocha-sinon');
const sinon = require('sinon');
var db = monk('localhost:27017/brainbox');
const U = require('../utils');

describe('Upload Controller: ', function() {

  describe('Validator function() ', function() {
    it('should perform the validations correctly', async function() {
      const reqSpy = sinon.spy();
      const urlSpy = sinon.spy();
      const alphaSpy = sinon.spy();
      const req = {
        body: {
          url: 'abc',
          atlasName: '',
          atlasProject: '',
          atlasLabelSet: '',
          token: ''
        },
        query: { },
        params: { },
        value: 0,
        validationErrors: function() {
          if(!this.body.url) { return new Error('Validations failed!'); }

          return null;
        },
        checkBody: sinon.stub().returns({ notEmpty: reqSpy, isURL: urlSpy, isAlphanumeric: alphaSpy })
      };
      const resSpy = sinon.spy();
      const sendStub = sinon.stub().returns({ end: resSpy });
      const res = {
        status: sinon.stub().returns({ send: sendStub })
      };
      await uploadController.validator(req, res, () => {});
      assert.strictEqual(reqSpy.callCount, 5);
      assert.strictEqual(urlSpy.callCount, 1);
      assert.strictEqual(resSpy.callCount, 0);
      assert.strictEqual(alphaSpy.callCount, 2);
      sinon.restore();
    });

    it('should throw errors if any validation fails', async function() {
      const reqSpy = sinon.spy();
      const urlSpy = sinon.spy();
      const alphaSpy = sinon.spy();
      const req = {
        body: {
          url: '',
          token: ''
        },
        query: { },
        params: { },
        value: 0,
        validationErrors: function() {
          if(!this.body.atlasLabelSet || !this.body.url || !this.body.atlasName || !this.body.atlasProject || !this.body.token) { return new Error('Validations failed!'); }

          return null;
        },
        checkBody: sinon.stub().returns({ notEmpty: reqSpy, isURL: urlSpy, isAlphanumeric: alphaSpy })
      };
      const resSpy = sinon.spy();
      const sendStub = sinon.stub().returns({ end: resSpy });
      const res = {
        status: sinon.stub().returns({ send: sendStub })
      };
      await uploadController.validator(req, res, () => {});
      assert.strictEqual(reqSpy.callCount, 5);
      assert.strictEqual(urlSpy.callCount, 1);
      assert.strictEqual(resSpy.callCount, 1);
      assert.strictEqual(alphaSpy.callCount, 2);
      sinon.restore();
    });
  });


  describe('other_validations function() ', function() {
    it('should perform the other validations successfully', async function() {
      const req = {
        body: {
          token: U.testToken + 'foo',
          url: ''
        },
        files: [],
        tokenDuration: 2 * (1000 * 3600),
        query: { },
        params: { },
        value: 0,
        db: db
      };
      const resSpy = sinon.spy();
      const jsonSpy = sinon.spy();
      const sendStub = sinon.stub().returns({ end: resSpy });
      const res = {
        status: sinon.stub().returns({ send: sendStub, json: sinon.stub().returns({ end: jsonSpy })})
      };
      await uploadController.other_validations(req, res, () => {});
      assert.strictEqual(jsonSpy.callCount, 1);
      assert.strictEqual(resSpy.callCount, 0);
      sinon.restore();
    });

    it('should not accept a token that has expired.', async function () {
      const req = {
        body: {
          token: U.testToken + 'foo',
          url: ''
        },
        files: [],
        tokenDuration: 60*60,
        query: { },
        params: { },
        value: 0,
        db: db
      };
      const resSpy = sinon.spy();
      const jsonSpy = sinon.spy();
      const sendStub = sinon.stub().returns({ end: resSpy });
      const res = {
        status: sinon.stub().returns({ send: sendStub, json: sinon.stub().returns({ end: jsonSpy })})
      };
      await uploadController.other_validations(req, res, () => {});
      assert.strictEqual(jsonSpy.callCount, 0);
      assert.strictEqual(resSpy.callCount, 1);
      assert.strictEqual(sendStub.args[0][0], 'ERROR: Token expired');
      sinon.restore();
    });

    it('should throw an error if the token is invalid', async function () {
      const req = {
        body: {
          token: '',
          url: ''
        },
        files: [],
        tokenDuration: 60*60,
        query: { },
        params: { },
        value: 0,
        db: db
      };
      const resSpy = sinon.spy();
      const jsonSpy = sinon.spy();
      const sendStub = sinon.stub().returns({ end: resSpy });
      const res = {
        status: sinon.stub().returns({ send: sendStub, json: sinon.stub().returns({ end: jsonSpy })})
      };
      await uploadController.other_validations(req, res, () => {});
      assert.strictEqual(jsonSpy.callCount, 0);
      assert.strictEqual(resSpy.callCount, 1);
      assert.strictEqual(sendStub.args[0][0], 'ERROR: Cannot find token');
      sinon.restore();
    });
  });
});
