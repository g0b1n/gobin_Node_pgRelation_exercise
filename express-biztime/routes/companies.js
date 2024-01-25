
const db = require("../db");
const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");


router.get("/", async (req, res, next) => {
    try {
        const results = await db.query(`SELECT id, code, name, description FROM companies`);

        // if company not found print error 404
        if (results.rows.length === 0) {
            throw new ExpressError(`Companies not Found`, 404)
        }
        
        return res.json({company: results.rows});
       
    } catch (err) {
        return next(err);
    }
});

// gets company by their code and also gets their invoices
router.get('/:code', async (req, res, next) => {
    const {code} = req.params
    try{
        // get companies by their code name
        const companyRes = await db.query(`SELECT id, code, name, description FROM companies where code = $1`, [code]);
        // if company not found print error 404
        if(companyRes.rows.length === 0){
            throw new ExpressError(`Company ${code} is not found`, 404)
        }

        const company = companyRes.rows[0];

        // get all invoices for this company
        const invoiceRes = await db.query(`SELECT id FROM invoices WHERE comp_id = $1`, [company.id]);

        // get invoice ids into an array
        const invoiceIds = invoiceRes.rows.map(invoice => invoice.id);

        // construct the response with company details & invoice ids
        const companyData = {
            code: company.code,
            name: company.name,
            description: company.description,
            invoice: invoiceIds
        }

        return res.json({ company: companyData });

    } catch (err) {
        return next(err);
    }
})

router.post('/', async (req, res, next) => {
    try {
        const{ code, name, description} = req.body;

        // throw 400 error is no Name or Code
        if ( !name || !code ) {
            throw new ExpressError("Company name is required", 400) // 400 Bad request
        };
        // insert companies. their code, name, descriptions
        const newCompany = await db.query(`INSERT INTO companies (code, name, description) VALUES($1, $2, $3) RETURNING id, code, name, description`,
        [code, name, description]);

        return res.status(201).json({ company: newCompany.rows[0]});
    } catch (err) {
        return next(err);
    }
})

router.patch('/:code', async(req, res, next) => {
    try {
        const companyCode = req.params.code;
        const { name, description } = req.body;

        // throw 400 error is no Name or Code
        if (!name) {
            throw new ExpressError("Company name is required", 400) // 400 Bad request
        };
        const result = await db.query(`UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING id, code, name, description`,
        [name, description, companyCode]);

        if (result.rows.length === 0){
            throw new ExpressError(`Company with the code ${companyCode} doesn't exist`, 404)
        }

        return res.json({ company: result.rows[0]});
    } catch (err) {
        return next(err);
    }
})

router.delete('/:code', async(req, res, next) => {
    try {
        const companyCode = req.params.code;

        // check if company exist or not
        const checkCompany = await db.query(`SELECT * FROM companies WHERE code = $1`, [companyCode])
        if (checkCompany.rows.length === 0) {
            throw new ExpressError(`Company with the code ${companyCode}, does not exits`, 404)
        }
         // if company found delete it
        await db.query(`DELETE FROM companies WHERE code = $1`, [companyCode])
        
        return res.json({ message: `Company with the code ${companyCode} is deleted`});
    } catch (err) {
        return next(err);
    }
})

module.exports = router;