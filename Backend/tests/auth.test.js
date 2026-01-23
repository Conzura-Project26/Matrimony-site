const request = require('supertest');
const app = require('../index');

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({
        full_name: 'Test User',
        gender: 'Male',
        date_of_birth: '2000-01-01',
        mobile_number: '9999999999',
        email: 'test@example.com',
        password: 'password123',
        profile_created_by: 'Self',
        role_name: 'USER'
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.user).toHaveProperty('id');
  });

  it('should login a user', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        mobile_number: '9999999999',
        password: 'password123'
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });
});
