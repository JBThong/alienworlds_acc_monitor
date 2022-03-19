import { useState, useEffect, useRef } from 'react'
import AccountInfo from './AccountInfo';
import http from './Axios';
import toastr from "toastr";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Cookies from 'universal-cookie'
import { DateTime } from 'luxon'


export default function AccoutStake(props) {
    const {accountStake, accounts, wax, onDelete } = props
    const [accInfo, setAcc] = useState(accountStake)
    const [showStakeForm, setShowStakeForm] = useState(false)
    const [showBuyRamForm, setShowBuyRamForm] = useState(false)

    
    let showFormStake =  () => setShowStakeForm(!showStakeForm)
    let showFormBuyRam =  () => setShowBuyRamForm(!showBuyRamForm)

    useEffect(async () => {
        console.log(accountStake)
        fetchAccountData(accountStake?.userName);
    }, [accountStake])

    const fetchAccountData = async (user) => {
        let result = null
        if (typeof user === 'undefined') {
            return ;
        }
        const config = {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS"
            }
          };
        await http.post('https://api.wax.liquidstudios.io/v1/chain/get_account',
        {
            "account_name": user
        }, config).then((resp) => {
            // console.log(resp)
            if(resp && resp.data) {
                result = resp.data
            }
        })
        .catch((err) => {
            console.log(err)
        })

        if(result) {
            console.log(result)
            setAcc(result)
        }
       
    }

    const unstakeAll = async ()  => {
        if(!wax.api) {
            toast.error('🦄 You need to login wax account before doing actions!');
        }
        console.log(accountStake?.userName)

        let config = {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS"
            }
          };
        
        let result = await http.post('https://api.wax.liquidstudios.io/v1/chain/get_table_rows',{
            json: true, code: "eosio", scope: accountStake?.userName, table: 'delband', limit: -1, lower_bound: "", index_position: 1
        }, config).then((resp) => {
            if(resp && resp.data) {
                return resp.data
            }
        })
        .catch((err) => {
            console.log(err)
        })

        if (result) {
            console.log(result)
            let listReceive = await result.rows.map((item) => {
                return item.to;
            });

            // console.log(listReceive);

            for (let acc of accounts) {
                if (listReceive.indexOf(acc) > 0) {

                    let unstake_net_quantity = result.rows[listReceive.indexOf(acc)]?.net_weight;
                    let unstake_cpu_quantity = result.rows[listReceive.indexOf(acc)]?.cpu_weight;
                    console.log(unstake_net_quantity, unstake_cpu_quantity)

                    let unstake = await wax.api?.transact({
                        actions: [{
                            account: 'eosio',
                            name: 'undelegatebw',
                            authorization: [{
                                actor: wax.userAccount,
                                permission: 'active',
                            }],
                            data: {
                                from: wax.userAccount,
                                receiver: acc,
                                unstake_net_quantity: unstake_net_quantity,
                                unstake_cpu_quantity: unstake_cpu_quantity,
                                transfer: false,
                                memo: 'Unstaking wax.'
                            },
                        }]
                        }, {
                            blocksBehind: 3,
                            expireSeconds: 30
                        });

                    if (unstake) {
                        console.log(unstake);
                        onDelete(acc)
                    }
                }
            }
        }
    }

    function FormStake() {
        const [stakewaxs, setStakeWaxs] = useState({});

        const handleChangeStakeWax = (event) => {
            let name = event.target.name;
            let value = event.target.value;
            setStakeWaxs(values => ({...values, [name]: value}))
            
          }
        
        const onSubmitStake = async(event) => {
            let accstakes = accounts;
            event.preventDefault();
            
            if(!wax.api) {
                toast.error('🦄 You need to login wax account before doing actions!');
            }

            if (!stakewaxs.cpu_quantity || !stakewaxs.net_quantity || 
                parseFloat(stakewaxs.cpu_quantity) < 0 || parseFloat(stakewaxs.net_quantity) < 0) {
                    toast.error('🦄 Please check agruments cpu and net!');
                    return;
            } 
            console.log(parseFloat(stakewaxs.cpu_quantity).toFixed(8) + ' WAX')
            console.log('0.00000001 WAX')
            // return;

            for (let acc of accstakes) {
                let result = await wax.api?.transact({
                    actions: [{
                        account: 'eosio',
                        name: 'delegatebw',
                        authorization: [{
                        actor: wax.userAccount,
                        permission: 'active',
                        }],
                        data: {
                            from: wax.userAccount,
                            receiver: acc,
                            stake_net_quantity: parseFloat(stakewaxs.net_quantity).toFixed(8) + ' WAX',
                            stake_cpu_quantity: parseFloat(stakewaxs.cpu_quantity).toFixed(8) + ' WAX',
                            transfer: false,
                            memo: 'Staking wax.'
                        },
                    }]
                    }, {
                        blocksBehind: 3,
                        expireSeconds: 30
                    });
                

                if (result) {
                    console.log(result);
                    console.log(acc)
                    onDelete(acc);
                }

            }
        }
        
        return (
            <form onSubmit={onSubmitStake} className="">
                <label>Enter cpu:
                    <input 
                        type="text" 
                        name="cpu_quantity" 
                        value={stakewaxs.cpu_quantity || ''} 
                        onChange={(e) => handleChangeStakeWax(e)}
                        style={{color: "black"}}
                    />
                </label>
                <label>Enter net:
                    <input 
                        type="text" 
                        name="net_quantity" 
                        value={stakewaxs.net_quantity || ''} 
                        onChange={(e) => handleChangeStakeWax(e)}
                        style={{color: "black"}}
                    />
                    </label>
                    <input type="submit" className = 'bg-gray-500 hover:bg-blue-800 text-white font-bold ml-4 border-black rounded px-4 py-2 w-40'/>
                </form>
        )
    }

    function FormBuyRam() {
        const [ramQuantity, setRamQuantity] = useState(0);
        
        async function onSubmitBuyRam(e) {
            e.preventDefault();
            console.log(ramQuantity);
            let accstakes = accounts;
            
            if(!wax.api) {
                toast.error('🦄 You need to login wax account before doing actions!');
            }

            if (!ramQuantity || parseFloat(ramQuantity) < 0) {
                toast.error('🦄 Please check agruments ram bytes!');
                return;
            }
            for (let acc of accstakes) {
                let result = await wax.api?.transact({
                    actions: [{
                        account: 'eosio',
                        name: 'buyrambytes',
                        authorization: [{
                        actor: wax.userAccount,
                        permission: 'active',
                        }],
                        data: {
                        payer: wax.userAccount,
                        receiver: acc,
                        bytes: parseInt(ramQuantity),
                        },
                    }]
                    }, {
                        blocksBehind: 3,
                        expireSeconds: 1200,
                    });
                
                if (result) {
                    console.log(result)
                    console.log(acc)
                    onDelete(acc);
                }
            }
        }
    
        return (
            <div>
                <form onSubmit={(e)=>onSubmitBuyRam(e)}>
                <label>Enter amount:
                    <input 
                        type="textarea" 
                        name="ramAmount"
                        value={ramQuantity}
                        onChange={(e) => setRamQuantity(e.target.value)}
                        style={{color: "black"}}
                        />
                    </label>
                    <input type="submit" className = 'bg-gray-500 hover:bg-blue-800 text-white font-bold ml-4 border-black rounded px-4 py-2 w-40'/>
                </form>
            </div>
        )
    }

    const fetchTLM = async (user) => {
        let config = {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS"
            }
          };
        return await http.post('https://api.wax.liquidstudios.io/v1/chain/get_currency_balance',
            {
                "code": "alien.worlds",
                "account": user,
                "symbol": "TLM"
            }, config)
            .then((resp) => {
                if(resp && resp.data) {
                    console.log(resp.data)
                    return resp.data[0].slice(0, -4)
                }
            })
            .catch((err) => {
                console.log(err)
            })
    }

    const roundTLM = async ()  => {
        if(!wax.api) {
            toast.error('🦄 You need to login wax account before doing actions!');
        }
        console.log(accountStake?.userName)

        
        for (let acc of accounts) {
            let tlm = await fetchTLM(acc);
            if (!tlm) {
                continue;
            }
            let tlmtransfer = await (1 - (tlm % 1).toFixed(4)).toFixed(4)
            console.log('Transfer tlm: ' + tlmtransfer);
            
            let result = await wax.api.transact({
                actions: [{
                account: 'alien.worlds',
                name: 'transfer',
                authorization: [{
                    actor: wax.userAccount,
                    permission: 'active',
                  }],
                  data: {
                    from: wax.userAccount,
                    to: acc,
                    quantity: tlmtransfer + ' TLM',
                    memo: 'Transfer tlm',
                  },
                }]
                }, {
                    blocksBehind: 3,
                    expireSeconds: 1200,
                });

            if (result) {
                console.log(result);
                onDelete(acc)
            }

        }
    }

    return (
        <div className="flex flex-col my-5">
            Account Stake: {accInfo?.account_name} - {accInfo?.core_liquid_balance}
            <div>
                <button className='text-md mx-4 my-2 border-black border-2 rounded px-4 py-2 w-40' onClick={showFormStake}>Stake</button>
                <button className='text-md mx-4 my-2 border-black border-2 rounded px-4 py-2 w-40' onClick={showFormBuyRam}>Buy Ram</button>
                <button className='text-md mx-4 my-2 border-black border-2 rounded px-4 py-2 w-40' onClick={unstakeAll}>Unstake All</button>
                <button className='text-md mx-4 my-2 border-black border-2 rounded px-4 py-2 w-40' onClick={roundTLM}>Round TLM</button>
            </div>

            <div className = 'px-4 py-2 mx-4 my-2'>
                { showStakeForm ? <FormStake /> : null }
            </div>
            <div className = 'px-4 py-2 mx-4 my-2'>
                { showBuyRamForm ? <FormBuyRam /> : null }
            </div>
            <div><ToastContainer autoClose={1000} /></div>
        </div>
    )
}