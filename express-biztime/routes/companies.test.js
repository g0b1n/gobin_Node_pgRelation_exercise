
// this lets my db file know to use the test database
process.env.NODE_ENV = 'test';

const request = require('supertest')
const app = require('../app');
const db = require('../db');


let testCompany;

beforeEach(async () => {
    const result = await db.query(`INSERT INTO companies (code, name, description) VALUES ('gogl', 'Google', 'One of the largest search engine') RETURNING id, code, name, description`)
    testCompany = result.rows[0]
})

afterEach(async () => {
    await db.query(`DELETE FROM invoices`)
    await db.query(`DELETE FROM companies`)
})

afterAll(async () => {
    await db.end();
})

describe("GET /companies", () => {
    test("Get a list of companies", async () => {
        const res = await request(app).get('/companies')
        expect(res.statusCode).toBe(200)
        expect(res.body).toEqual({company: [testCompany]})
    })
})

describe("GET /companies/:code", () => {
    test("Get a single company", async () => {
        // Insert an invoice for the existing company
        const invoiceResult = await db.query(`INSERT INTO invoices (comp_id, amt, paid) VALUES ((SELECT id FROM companies WHERE code = 'gogl'), 100, false) RETURNING id`);
        const invoiceId = invoiceResult.rows[0].id;

        // Get the company by code
        const res = await request(app).get(`/companies/gogl`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({
            company: {
                code: 'gogl',
                name: 'Google',
                description: 'One of the largest search engine',
                invoice: [invoiceId]
            }
        });
    });
});


describe("POST /companies", () => {

    // First test case: Tests creating a new company
    test("Create a new company", async () => {
        // Define the data to be sent in the POST request
        const newCompanyData = {
            code: "testco",
            name: "Test Company",
            description: "A company created for testing"
        };

        // Perform a POST request with the new company data
        const res = await request(app)
            .post('/companies')
            .send(newCompanyData);

        // Check if the response status is 201 (Created)
        expect(res.statusCode).toBe(201);
        // Check if the response body matches the expected format
        expect(res.body).toEqual({
            company: {
                id: expect.any(Number), // Expecting a number for id, but value is not predetermined
                code: "testco",
                name: "Test Company",
                description: "A company created for testing"
            }
        });
    });

    // Second test case: Tests the route's response when the 'name' field is missing
    test("Returns 400 for missing name", async () => {
        // Perform a POST request with missing 'name' field
        const res = await request(app)
            .post('/companies')
            .send({ code: "testco" });

        // Check if the response status is 400 (Bad Request)
        expect(res.statusCode).toBe(400);
    });

    // Third test case: Tests the route's response when the 'code' field is missing
    test("Returns 400 for missing code", async () => {
        // Perform a POST request with missing 'code' field
        const res = await request(app)
            .post('/companies')
            .send({ name: "Test Company" });

        // Check if the response status is 400 (Bad Request)
        expect(res.statusCode).toBe(400);
    });
});


describe("PATCH /companies/:code", () => {

    // Test case: Update a company's name and description
    test("Update a company", async () => {
        // Define new data for updating the company
        const updatedData = {
            name: "Updated Company Name",
            description: "Updated Description"
        };

        // Perform a PATCH request with the new data to update the company with code 'gogl'
        const res = await request(app)
            .patch('/companies/gogl')
            .send(updatedData);

        // Check if the response status is 200 (OK)
        expect(res.statusCode).toBe(200);
        // Check if the response body matches the expected format
        expect(res.body).toEqual({
            company: {
                id: expect.any(Number), // Expecting a number for id, but value is not predetermined
                code: "gogl",
                name: "Updated Company Name",
                description: "Updated Description"
            }
        });
    });

    // Test case: Test for the scenario where the company code does not exist
    test("Returns 404 for non-existing company", async () => {
        // Perform a PATCH request to update a non-existing company
        const res = await request(app)
            .patch('/companies/nonexisting')
            .send({ name: "Non-existing Company" });

        // Check if the response status is 404 (Not Found)
        expect(res.statusCode).toBe(404);
    });

    // Test case: Test for the scenario where the 'name' field is missing in the request body
    test("Returns 400 for missing name", async () => {
        // Perform a PATCH request without a 'name' field
        const res = await request(app)
            .patch('/companies/gogl')
            .send({ description: "New Description" });

        // Check if the response status is 400 (Bad Request)
        expect(res.statusCode).toBe(400);
    });
});


describe("DELETE /companies/:code", () => {

    // Test case: Delete an existing company
    test("Deletes a company", async () => {
        // Insert a company to be deleted later in the test
        await db.query(`INSERT INTO companies (code, name, description) VALUES ('delco', 'Delete Company', 'Company to be deleted')`);

        // Perform a DELETE request for the company with code 'delco'
        const res = await request(app)
            .delete('/companies/delco');

        // Check if the response status is 200 (OK)
        expect(res.statusCode).toBe(200);
        // Check if the response body is as expected
        expect(res.body).toEqual({ message: `Company with the code delco is deleted` });

        // Verify that the company is indeed deleted from the database
        const result = await db.query(`SELECT * FROM companies WHERE code = 'delco'`);
        expect(result.rows.length).toBe(0);
    });

    // Test case: Attempt to delete a non-existing company
    test("Returns 404 for non-existing company", async () => {
        // Perform a DELETE request for a non-existing company
        const res = await request(app)
            .delete('/companies/nonexisting');

        // Check if the response status is 404 (Not Found)
        expect(res.statusCode).toBe(404);
    });
});
