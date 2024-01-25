
const db = require("../db");
const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");


router.get("/", async (req, res, next) => {
    try {
        const results = await db.query(`SELECT * FROM invoices`);

        if( results.rows.length === 0){
            throw new ExpressError(`Invoices not found`, 404)
        }

        return res.json(results.rows);
    } catch (err) {
        return next(err);
    }
});

router.get("/:id", async (req, res, next) => {
    const { id } = req.params;
    try {
        // get invoices
        const invoiceResults = await db.query(
            `SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, 
             c.code, c.name, c.description 
             FROM invoices AS i
             JOIN companies AS c ON i.comp_id = c.id
             WHERE i.id = $1`, [id]);

        if (invoiceResults.rows.length === 0) {
            throw new ExpressError(`Invoice with the id: ${id} is not found`, 404);
        }

        const invoice = invoiceResults.rows[0];
        const invoiceData = {
            id: invoice.id,
            amt: invoice.amt,
            paid: invoice.paid,
            add_date: invoice.add_date,
            paid_date: invoice.paid_date,
            company: {
                code: invoice.code,
                name: invoice.name,
                description: invoice.description
            }
        };

        return res.json({ invoice: invoiceData });
    } catch (err) {
        return next(err);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;

        // validate the input
        if (!comp_code || amt === undefined) {
            throw new ExpressError("Company code and amount are required", 400); // bad request
        }

        // Get the company id from the company code
        const companyRes = await db.query(`SELECT id FROM companies WHERE code = $1`, [comp_code]);
        if (companyRes.rows.length === 0) {
            throw new ExpressError(`Company with code ${comp_code} not found`, 404); // not found
        }
        const comp_id = companyRes.rows[0].id;

        // insert new invoice into db
        const result = await db.query(
            `INSERT INTO invoices (comp_id, amt) VALUES ($1, $2) RETURNING *`, [comp_id, amt]
        );
        return res.status(201).json({ invoice: result.rows[0] });
    } catch (err) {
        return next(err);
    }
});


// updates the invoice amt
router.patch("/:id", async (req, res, next) => {
    try{
        const { id } = req.params;
        const {amt} = req.body;
        // validate input
        if(amt === undefined) {
            throw new ExpressError("Please provide an amount", 400) // bad request
        }

        // check if the invoice exist
        const checkInvoice = await db.query(`SELECT * FROM invoices WHERE id = $1`, [id]);
        if (checkInvoice.rows.length === 0) {
            throw new ExpressError(`Invoice with the ID of ${id} cannot be found`, 404);
        }

        // update the invoice in db
        const result = await db.query(
            `UPDATE invoices SET amt = $1 WHERE id = $2 RETURNING id, comp_id, amt, paid, add_date, paid_date`,
            [amt, id]
        );

        //join companies to get comp_code
        const updatedInvoice = result.rows[0];
        const companyResult = await db.query(`SELECT code FROM companies WHERE id = $1`, [updatedInvoice.comp_id]);

        // include comp_code in the response
        updatedInvoice.comp_code = companyResult.rows[0].code;

        return res.json({ invoice: updatedInvoice });
    } catch(err) {
        return next(err);
    }
})

router.delete("/:id", async (req, res, next) => {
    try{
        const {id} = req.params;

        // check if invoice exist
        const checkInvoice = await db.query(`SELECT * FROM invoices WHERE id = $1`, [id]);
        if (checkInvoice.rows.length === 0) {
            throw new ExpressError(`Invoice with the id of ${id}, cannot be found`, 404)
        }

        // if found delete it
        await db.query(`DELETE FROM invoices WHERE id = $1`, [id]);

        // return response
        return res.json({ message: "Invoice deleted"});
    } catch(err) {
        return next(err);
    }
})

module.exports = router