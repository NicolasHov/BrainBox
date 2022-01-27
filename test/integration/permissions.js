'use strict';

const chai = require('chai');
var {assert, expect} = chai;
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const U = require('../utils.js');
const {server} = require('../../app');
const puppeteer = require('puppeteer');

// FIXME move me
const testingCredentials = {
  username: "testing-user",
  password: "baz"
};

describe('TESTING PERMISSIONS', function () {
  const forbiddenStatusCodes = [403, 401];
  const agent = chai.request.agent(server);
  let token = '';

  const get = function(url, logged) {
    if (logged) {
      return agent.get(url).query({ token });
    }

    return chai.request(U.serverURL).get(url);
  };

  const post = function(url, logged) {
    if (logged) {
      return agent.post(`${url}?token=${token}`);
    }

    return chai.request(U.serverURL).post(url);
  };

  const del = function(url, logged) {
    if (logged) {
      return agent.del(url).query({ token });
    }

    return chai.request(U.serverURL).del(url);
  };

  before(async function () {
    try {
      await agent.post('/localSignup')
        .send(testingCredentials)
        .timeout(1000); // FIXME: (in nwl)works but hangs indefinitely
    } catch(_e) {
      //
    }
    let res = await agent.post('/localLogin').redirects(0)
      .send(testingCredentials);
    expect(res).to.have.cookie('connect.sid');

    res = await agent.get('/token');
    assert.exists(res.body.token);
    assert.isNotEmpty(res.body.token);
    token = res.body.token;
  });

  after(function () {
    agent.close();
    U.removeUser(testingCredentials.username);
  });

  describe('Test basic unprivileged access', function() {

    ['unlogged', 'logged'].forEach((userStatus) => {

      const logged = userStatus === 'logged';

      it(`Disallows accessing a private project (${userStatus})`, async function () {
        const res = await get('/project/' + U.privateProjectTest.shortname, logged);
        assert.oneOf(res.statusCode, forbiddenStatusCodes);
      });

      it(`Disallows accessing a private project settings (${userStatus})`, async function () {
        const res = await get('/project/' + U.privateProjectTest.shortname + '/settings', logged);
        assert.oneOf(res.statusCode, forbiddenStatusCodes);
      });

      it(`Disallows accessing a private project using JSON api (${userStatus})`, async function () {
        const res = await get('/project/json/' + U.privateProjectTest.shortname, logged);
        assert.oneOf(res.statusCode, forbiddenStatusCodes);
      });

      it(`Disallows accessing a private project files (${userStatus})`, async function () {
        const res = await get('/project/json/' + U.privateProjectTest.shortname + '/files?start=0&length=20', logged);
        assert.oneOf(res.statusCode, forbiddenStatusCodes);
      });

      it(`Disallows updating a private project (${userStatus})`, async function () {
        const res = await post('/project/json/' + U.privateProjectTest.shortname, logged)
          .send({data: U.privateProjectTest});
        assert.oneOf(res.statusCode, forbiddenStatusCodes);
      });

      it(`Disallows deleting a private project (${userStatus})`, async function () {
        const res = await del('/project/json/' + U.privateProjectTest.shortname, logged);
        assert.oneOf(res.statusCode, forbiddenStatusCodes);
      });
    });
  });

  describe('Test specific edit / add / remove permissions of logged users', function() {
    const createProjectWithPermission = function(name, accessProp) {
      const access = Object.assign({}, {
        collaborators: "view",
        annotations: "none",
        files: "none"
      }, accessProp);

      const project = {
        name: name,
        shortname: name,
        url: "https://testproject.org",
        brainboxURL: "/project/" + name,
        created: (new Date()).toJSON(),
        owner: "foo",
        collaborators: { list: [
          {
            userID: "anyone",
            access: {
              collaborators: "none",
              annotations: "none",
              files: "none"
            },
            username: "anyone",
            name: "Any User"
          }
        ] },
        files: {
          list: [{source: "https://zenodo.org/record/44855/files/MRI-n4.nii.gz", name: "MRI-n4.nii.gz"}]
        },
        annotations: {
          list: [
            {
              type: "volume",
              name: "Annotation name",
              values: null
            }
          ]
        }
      };

      project.collaborators.list.push({
        access,
        userID: testingCredentials.username,
        username: testingCredentials.username,
        name: testingCredentials.username
      });

      return project;
    };

    const projects = {};
    const setupProjectWithAccess = (access, name) => {
      const project = createProjectWithPermission(name, access);
      projects[project.name] = project;
      U.insertProject(project);
    };

    before(function () {
      ["none", "view"].forEach((access) => {
        setupProjectWithAccess(
          { collaborators: access, files: 'edit' },
          `collaborators${access}filesedit`
        );
        setupProjectWithAccess(
          { collaborators: 'edit', files: access },
          `collaboratorseditfiles${access}`
        );
      });
      ["edit", "add", "remove"].forEach((access) => {
        setupProjectWithAccess(
          { collaborators: access, files: 'none' },
          `collaborators${access}filesnone`
        );
        setupProjectWithAccess(
          { collaborators: access, files: 'edit' },
          `collaborators${access}filesedit`
        );
        setupProjectWithAccess(
          { collaborators: 'edit', files: access },
          `collaboratorseditfiles${access}`
        );
      });
      ["none", "view", "add", "edit", "remove"].forEach((access) => {
        setupProjectWithAccess(
          { collaborators: 'edit', files: 'edit', annotations: access },
          `collaboratorseditfileseditannotations${access}`
        );
      });

    });

    after(function() {
      Object.keys(projects).forEach((shortname) => {
        U.removeProject(shortname);
      });

    });

    it('Checks that collaborators cannot edit a project if files have a lower access value', async function() {
      const project = projects.collaboratorseditfilesnone;
      const res = await post('/project/json/' + project.shortname, true)
        .send({data: project});
      assert.oneOf(res.statusCode, forbiddenStatusCodes);
    });

    it('Checks that collaborators cannot remove a project if files have a lower access value', async function() {
      const project = projects.collaboratorsremovefilesnone;
      const res = await del('/project/json/' + project.shortname, true);
      assert.oneOf(res.statusCode, forbiddenStatusCodes);
    });

    it('Checks that collaborators can edit a project if files have an equal access value', async function() {
      const project = projects.collaboratorseditfilesedit;
      const res = await post('/project/json/' + project.shortname, true)
        .send({data: project});
      assert.equal(res.statusCode, 200);
    });

    it('Checks that collaborators can edit a project if files have a superior access value', async function() {
      const project = projects.collaboratorseditfilesremove;
      const res = await post('/project/json/' + project.shortname, true)
        .send({data: project});
      assert.equal(res.statusCode, 200);
    });

    it('Checks that collaborators cannot add project collaborators if set to none or view', async function() {
      let project = projects.collaboratorsnonefilesedit;
      project.collaborators.list.push({
        userID: "foo",
        access: {
          collaborators: "edit",
          annotations: "edit",
          files: "edit"
        },
        username: "foo",
        name: "Foo"
      });

      let res = await post('/project/json/' + project.shortname, true)
        .send({data: project});
      assert.oneOf(res.statusCode, forbiddenStatusCodes);

      project = projects.collaboratorsviewfilesedit;
      project.collaborators.list.push({
        userID: "foo",
        access: {
          collaborators: "edit",
          annotations: "edit",
          files: "edit"
        },
        username: "foo",
        name: "Foo"
      });
      res = await post('/project/json/' + project.shortname, true)
        .send({data: project});
      assert.oneOf(res.statusCode, forbiddenStatusCodes);
    });

    it('Checks that collaborators can add project collaborators if set to add or remove', async function() {
      let project = projects.collaboratorsaddfilesedit;
      project.collaborators.list.push({
        userID: "foo",
        access: {
          collaborators: "edit",
          annotations: "edit",
          files: "edit"
        },
        username: "foo",
        name: "Foo"
      });

      let res = await post('/project/json/' + project.shortname, true)
        .send({data: project});
      assert.oneOf(res.statusCode, forbiddenStatusCodes);

      project = projects.collaboratorsremovefilesedit;
      project.collaborators.list.push({
        userID: "foo",
        access: {
          collaborators: "edit",
          annotations: "edit",
          files: "edit"
        },
        username: "foo",
        name: "Foo"
      });
      res = await post('/project/json/' + project.shortname, true)
        .send({data: project});
      assert.oneOf(res.statusCode, forbiddenStatusCodes);
    });


    it('Checks that collaborators cannot add project annotations if set to none or view', async function() {
      let project = projects.collaboratorseditfileseditannotationsnone;
      project.annotations.list.push({
        type: "text",
        name: "Annotation name",
        values: null
      });
      let res = await post('/project/json/' + project.shortname, true)
        .send({data: project});
      assert.oneOf(res.statusCode, forbiddenStatusCodes);

      project = projects.collaboratorseditfileseditannotationsview;
      project.annotations.list.push({
        type: "text",
        name: "Annotation name",
        values: null
      });
      res = await post('/project/json/' + project.shortname, true)
        .send({data: project});
      assert.oneOf(res.statusCode, forbiddenStatusCodes);
    });

    it('Checks that collaborators cann add project annotations if set to add or remove', async function() {
      let project = projects.collaboratorseditfileseditannotationsadd;
      project.annotations.list.push({
        type: "text",
        name: "Annotation name",
        values: null
      });
      let res = await post('/project/json/' + project.shortname, true)
        .send({data: project});
      assert.oneOf(res.statusCode, forbiddenStatusCodes);

      project = projects.collaboratorseditfileseditannotationsremove;
      project.annotations.list.push({
        type: "text",
        name: "Annotation name",
        values: null
      });
      res = await post('/project/json/' + project.shortname, true)
        .send({data: project});
      assert.oneOf(res.statusCode, forbiddenStatusCodes);
    });


    it('Checks that collaborators cannot add project files if set to none or view', async function() {
      let project = projects.collaboratorseditfilesnone;
      project.files.list.push({source: "https://zenodo.org/record/44855/files/MRI-n4.nii.gz", name: "MRI-n4.nii.gz"});
      let res = await post('/project/json/' + project.shortname, true)
        .send({data: project});
      assert.oneOf(res.statusCode, forbiddenStatusCodes);

      project = projects.collaboratorseditfilesview;
      project.files.list.push({source: "https://zenodo.org/record/44855/files/MRI-n4.nii.gz", name: "MRI-n4.nii.gz"});
      res = await post('/project/json/' + project.shortname, true)
        .send({data: project});
      assert.oneOf(res.statusCode, forbiddenStatusCodes);
    });

    it('Checks that collaborators can add project files if set to add or remove', async function() {
      let project = projects.collaboratorseditfilesadd;
      project.files.list.push({source: "https://zenodo.org/record/44855/files/MRI-n4.nii.gz", name: "MRI-n4.nii.gz"});
      let res = await post('/project/json/' + project.shortname, true)
        .send({data: project});
      assert.oneOf(res.statusCode, forbiddenStatusCodes);

      project = projects.collaboratorseditfilesremove;
      project.files.list.push({source: "https://zenodo.org/record/44855/files/MRI-n4.nii.gz", name: "MRI-n4.nii.gz"});
      res = await post('/project/json/' + project.shortname, true)
        .send({data: project});
      assert.oneOf(res.statusCode, forbiddenStatusCodes);
    });

  });

  describe('Test view permissions of logged users', function() {
    let page;

    before(async function() {
      const browser = await puppeteer.launch({ headless: true, ignoreHTTPSErrors: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      page = browser.newPage();
    });

    it('Can access index page', async function () {
      await page.goto(U.serverURL);
      await page.waitForSelector('h2');
      const headerText = await page.evaluate(() => document.querySelector('h2').innerText, 'h2');
      assert.equal(headerText, 'Real-time collaboration in neuroimaging');
    }).timeout(U.longTimeout);


  });

});
