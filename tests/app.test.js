const request = require('supertest');
const sinon = require('sinon');
const { asyncLocalStorage } = require('../lib/security_agent');

describe('POST /execute', () => {
  let forkStub;
  let app;

  beforeAll(() => {
    forkStub = sinon.stub().returns({
      send: sinon.spy(),
      on: (event, callback) => {
        if (event === 'message') {
          callback('Mocked response');
        }
        if (event === 'error') {
          callback(new Error('Child process error'));
        }
      }
    });

    sinon.replace(require('child_process'), 'fork', forkStub);

    sinon.stub(asyncLocalStorage, 'run').callsFake((store, callback) => {
      asyncLocalStorage.enterWith(store);
      callback();
    });
    app = require('../app');
  });

  afterAll(() => {
    sinon.restore();
  });

  it('should respond with a message and requestId', async () => {
    const response = await request(app)
      .post('/execute')
      .send({ data: 'test input' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Mocked response',
      requestId: expect.any(String),
    });
  });

  it('should handle errors from the child process', async () => {
    forkStub.returns({
      send: sinon.spy(),
      on: (event, callback) => {
        if (event === 'error') {
          callback(new Error('Child process error'));
        }
      }
    });

    const response = await request(app)
      .post('/execute')
      .send({ data: 'test input' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Child process error',
      requestId: expect.any(String),
    });
  });
});
