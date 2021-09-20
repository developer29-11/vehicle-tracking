const express = require('express')
const bodyParser = require('body-parser');
const Joi = require('joi');
const appMeta = require('./package.json');
const dayjs = require('dayjs')
const knex = require('knex')({
    client: 'pg',
    connection: {
        host: 'ec2-63-33-14-215.eu-west-1.compute.amazonaws.com',
        port: 5432,
        user: 'yhcukmrkygjjff',
        password: '152db11aaed1ed362c54f845fadbcb25a7f5cfecbdb81f79a67efd1e173cbd8e',
        database: 'd73hqfsvgrfkam'
    },
    debug: true,
    useNullAsDefault: true
});

const port = 8000
const vinSchema = Joi.object({
    vin: Joi.string().required(),
    currentswver: Joi.string().allow(null),
    variant: Joi.string().allow(null),
    tcuswupdate: Joi.string().allow(null),
    tcuconfirmation: Joi.string().allow(null),
    smartcore: Joi.string().allow(null),
    mapcheck: Joi.string().allow(null),
    phase2: Joi.string().allow(null),
    otherecuupdate: Joi.string().allow(null),
    sanitycheck: Joi.string().allow(null),
    remark: Joi.string().allow(null),
    vehicleloc: Joi.string().allow(null),
    step1: Joi.number().integer().min(0).max(1).default(0),
    step2: Joi.number().integer().min(0).max(1).default(0),
    step3: Joi.number().integer().min(0).max(1).default(0),
    updateddate: Joi.string().default(() => dayjs().format())
})

const app = express()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`Vincheck API vesion ${appMeta.version} is running!`)
})

app.get('/vinrecord', (req, res) => {
    knex.select().table('public.vinrecord').then(data => {
        let response = {
            status: true,
            message: 'vinrecords',
            body: data
        }
        res.json(response);
    })
})

app.get('/vinrecord/:vin', (req, res) => {
    const vin = req.params.vin;
    knex.select().table('public.vinrecord').where('vin', '=', vin).then(data => {
        if (data.length) {
            data = data[0];
            console.log(data)
            if (data.step1 && data.step2 & data.step3) {
                data.iscompleted = true
            } else {
                data.iscompleted = false
            }
            if (!data.iscompleted) {
                data.resumeon = [data.step1, data.step2, data.step3].findIndex(e => e == 0) + 1;
            }
            let response = {
                status: true,
                message: `vinrecord ${vin}`,
                body: data
            }
            res.json(response);
        } else {
            res.json({ status: false, message: `No data found for vin ${vin}` });
        }

    })
})

app.post('/vinrecord', (req, res) => {
    const payload = vinSchema.validate(req.body, { abortEarly: false });
    if (payload.error) {
        return res.json(payload.error.details);
    }
    const vin = payload.value.vin;
    knex.select().table('public.vinrecord').where('vin', '=', vin).then(data => {
        if (data.length) {
            knex('public.vinrecord').where('vin', '=', vin).update(payload.value, '*').then(data => {
                res.json({ status: true, message: 'successs', body: data });
            })
        } else {
            knex('public.vinrecord').insert(payload.value, '*').then(data => {
                res.json({ status: true, message: 'success', body: data });
            })
        }
    })
})

app.put('/vinrecord', (req, res) => {
    const payload = vinSchema.validate(req.body, { abortEarly: false });
    if (payload.error) {
        return res.json(payload.error.details);
    }
    const vin = payload.value.vin;
    knex.select().table('public.vinrecord').where('vin', '=', vin).then(data => {
        if (data.length) {
            knex('public.vinrecord').where('vin', '=', vin).update(payload.value, '*').then(data => {
                res.json({ status: true, message: 'success', body: data });
            })
        } else {
            res.json({ status: false, message: `No data found for vin ${vin}` });
        }
    })
})

app.delete('/vinrecord', (req, res) => {
    const payload = vinSchema.validate(req.body, { abortEarly: false });
    if (payload.error) {
        return res.json(payload.error.details);
    }
    const vin = payload.value.vin;
    knex.select().table('public.vinrecord').where('vin', '=', vin).then(data => {
        if (data.length) {
            knex('public.vinrecord').where('vin', '=', vin).del('vin').then(data => {
                res.json({ status: true, message: 'success' });
            })
        } else {
            res.json({ status: false, message: `No data found for vin ${vin}` });
        }
    })
})

app.listen(port, () => {
    console.log(`vincheck app listening at http://localhost:${port}`)
})