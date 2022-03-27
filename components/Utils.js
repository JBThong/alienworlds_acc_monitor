import axios from 'axios';
import {ExplorerApi, RpcApi} from "atomicassets";

const api = new ExplorerApi("https://wax.api.atomicassets.io", "atomicassets", {fetch});



export const getAssets = async (user) => {
    let result = [];
    // Should be replace api.getAccountCollection and api.getTemplate khi nào rảnh
    await axios.get(`https://wax.api.atomicassets.io/atomicassets/v1/accounts/${user}/alien.worlds`)
        .then(async(resp) => {
            if(resp && resp.data) {
                let templates = resp.data.data.templates;
                for (let template of templates) {
                    let assest = {
                        quantity: template.assets,
                        template_id: template?.template_id
                    }
                    await axios.get(`https://wax.api.atomicassets.io/atomicassets/v1/templates/alien.worlds/${template?.template_id}`)
                    .then(res => {
                        if (res.data.data.schema.schema_name == "tool.worlds") {
                            assest.schema_name = res.data.data.schema.schema_name
                            assest.name = res.data.data.immutable_data.name;
                            result.push(assest);
                        }
                    })
                }
            }
        })
        .catch((err) => {
            console.log("get assets", err.toString())
        })
    
    return result;
}

// Get Asset ids of user by templateId
export const getAssetIdsByTemplateId = async(user, template_id) => {
    let result = [];

    let assets =  await api.getAssets({owner: user, collection_name: 'alien.worlds', template_id: template_id });
    result = await assets.map((item) => {
        return item.asset_id;
    });

    return result;
}