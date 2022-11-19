const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const moment = require("moment")
const axios = require("axios")
const config = require("./config")
const pluralize = require("pluralize")

app.use(bodyParser.json())

const webhook = {
    send: async (events) => {
        events = events.map(ev => {
            return {
                ...ev,
                appId: config.custom.app_id
            }
        })
        await axios({
            method: 'post',
            url: config.webhook.url,
            data: events
          });
    }
}

const data = {
    contacts: {
        list: [],
        set: {}
    },
    companies: {
        list: [],
        set: {}
    },
    deals: {
        list: [],
        set: {}
    },
    tickets: {
        list: [],
        set: {}
    }
}

const newId = (resourceName) => {
    return data[resourceName].list.length ? data[resourceName].list[data[resourceName].list.length-1] : 1
}

const getResourceName = (resources) => {
    switch(resources) {
        case "companies": return "company"
        case "contacts": return "contact"
        case "deals": return "deal"
        case "tickets": return "ticket"
    }
    throw new Error("NotImplemented")
}

app.post('/crm/v3/objects/:resource', async (req, res) => {
    const id = newId(req.params.resource)
    res.type("json");
    const ts = moment().format('YYYY-MM-DDTHH:mm:ss.SSS') + "Z"
    const resource = {
        id,
        createdAt: ts,
        updatedAt: ts,
        archived: false,    
        ...req.body
    }
    data[req.params.resource ].set[id] = resource
    data[req.params.resource ].list.push(id)
    await webhook.send([
        {
            portalId: config.custom.customer_id,
            subscriptionType: `${req.params.resource}.creation`,
            objectId: id
        }
    ])
    res.status(201)
    res.send(resource)
})

app.get('/crm/v3/objects/:resource/:resource_id', async (req, res) => {
    res.type("json");
    res.status(200)
    res.send(data[req.params.resource].set[parseInt(req.params.resource_id)])
})

app.patch('/crm/v3/objects/:resource/:resource_id', async (req, res) => {
    const resourceName = getResourceName(req.params.resource)
    const before = data[req.params.resource].set[parseInt(req.params.resource_id)].properties
    const after = { ...before }
    Object.keys(req.body.properties).forEach(prop => {
        after[prop] = req.body.properties[prop]
    })
    data[req.params.resource].set[parseInt(req.params.resource_id)].properties = after
    let notifications = []
    Object.keys(after).forEach(prop => {
        if (after[prop] != before[prop]) {
            notifications.push({
                portalId: config.custom.customer_id,
                subscriptionType: `${resourceName}.propertyChange`,
                objectId: parseInt(req.params.resource_id),
                propertyName: prop
            })
        }
    });
    await webhook.send(notifications)
    res.type("json");
    res.status(200)
    res.send(data[req.params.resource].set[parseInt(req.params.resource_id)])
})

app.get("/crm/v3/objects/:resource/:resource_id/associations/:to_object_type", async (req, res) => {
    const related = data[req.params.resource]
        .set[parseInt(req.params.resource_id)]
            [req.params.to_object_type] || []
    const results = related.map(elem => {
        return data[pluralize(req.params.to_object_type)]
            .set[elem]
    })
    res.type("json");
    res.status(200)
    res.send({
        results
    })
})

app.put("/crm/v3/objects/:resource/:resource_id/associations/:to_object_type/:object_id/:association_type", async (req, res) => {
    if (!data[req.params.resource]
        .set[parseInt(req.params.resource_id)]
            [req.params.to_object_type]) {
        data[req.params.resource]
        .set[parseInt(req.params.resource_id)]
            [req.params.to_object_type] = []
    }
    data[req.params.resource]
        .set[parseInt(req.params.resource_id)]
            [req.params.to_object_type]
            .push(parseInt(req.params.object_id))    
    res.status(200)
    res.send("done")
})

app.post("/oauth/v1/token", (req, res) => {
    res.type("json")
    res.status(200)
    res.send({
        access_token: "access-token",
        refresh_token: "refresh-token",
        expires_in: 999999,
        message: null,
        user: config.custom.customer_id
    })
})

app.get("/oauth/authorize", (req, res) => {
    const { client_id, scope, redirect_uri } = req.query
    const redirect_to = new URL(redirect_uri)
    redirect_to.searchParams.append("code", "code-to-exchange")
    console.log(`> redirecting to ${redirect_uri}`)
    res.redirect(redirect_to)
})

app.get("/oauth/v1/access-tokens/:token", (req, res) => {
    res.type("json")
    res.status(200)
    res.send({
        hub_id: config.custom.customer_id,
        token: "ReplaceWithToken",
        hub_domain: "ReplaceWithHubDomainHere",
        app_id: config.custom.app_id,
        expires_in: 999999,
        user_id: config.custom.customer_id,
        token_type: "token type"        
    })
})

app.get("/ping", (req, res) => {
    res.status(200)
    res.send("pong")
})

module.exports = app
