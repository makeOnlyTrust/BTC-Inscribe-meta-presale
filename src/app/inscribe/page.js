'use client';
// Inscribe.js

import React, { useState, useEffect } from 'react';
import { api } from "../utils/api";
import { unisatUtils } from "../utils/unisatUtils";
import { useWebContext } from "../../../context";
import whitelist from "../utils/whitelist.json"
import { ConstructionOutlined, FlareSharp } from '@mui/icons-material';
import toast, { Toaster } from "react-hot-toast";
import { stringToBase64, getStringByteCount } from '../utils/utils';
import { getAddress, sendBtcTransaction } from "sats-connect";
import { network } from '../utils/httpUtils';
let orderDetails = {
    orderId: "602e719f0c53fee50d493745556586e85c0fa0ee", // not fixed
    status: "pending",
    payAddress: "tb1prftrj4frlgc32tqdhds8m3tv574g2uvy6cd32j2hasn5l55mressr9qn66", // not fixed
    receiveAddress: "tb1qxaulyxd3g9at07jq0uhnw69uv72j5e4muldq55", // connected wallet address
    devAddress: "tb1qxaulyxd3g9at07jq0uhnw69uv72j5e4muldq55", // devAddress
    amount: 3453,
    paidAmount: 0,
    outputValue: 546,
    feeRate: 1,
    minerFee: 188,
    serviceFee: 2009,
    files: [
        {
            filename: "hi", // not fixed
            size: 2, // filename length
            status: "pending"
        }
    ],
    count: 1,
    pendingCount: 1,
    unconfirmedCount: 0,
    confirmedCount: 0,
    createTime: 1711099047614, // order request time
    devFee: 710,
    leftAmount: 0
}
export default function Inscribe() {
    const [state, { dispatch }] = useWebContext();
    const { address, accounts, balance, selectedwallet } = state;
    const [userAddress, setUserAddress] = useState('');
    const [userAddressCheck, setUserAddressCheck] = useState(false);
    const [userAddressCheckExist, setUserAddressExist] = useState('');


    const checkEligibility = () => {
        const isExist = whitelist.whitelist.includes(userAddress)
        if (isExist) {
            console.log('this is exist in whitelist')
            setUserAddressExist('yes')
        } else {
            console.log('this is not exist in whitelist')
            setUserAddressExist('no')
        }
    }

    async function createOrder() {
        try {
            if (userAddressCheckExist !== 'yes') {
                toast.error('Please enter address and check you are registered');
                return;
            }
            if (selectedwallet == "" | !accounts[0] || !address){
                toast.error('Please connect wallet');
                return;
            }
            let text = 'hi';
            let fileList = [
                {
                    filename: text.slice(0, 512),
                    dataURL: `data:text/plain;charset=utf-8;base64,${stringToBase64(text)}`,
                    size: getStringByteCount(text)
                }
            ]
            const { orderId } = await api.createOrder({
                receiveAddress: userAddress,
                feeRate: orderDetails.feeRate,
                outputValue: orderDetails.outputValue,
                files: fileList.map(item => ({ dataURL: item.dataURL, filename: item.filename })),
                devAddress: orderDetails.devAddress,
                devFee: orderDetails.devFee,
            })

            let orderInfo = await api.orderInfo(orderId);
            depositCoin(orderInfo.payAddress, orderInfo.amount, orderInfo.feeRate)

        } catch (error) {
            console.log("createOrder", error)
        }
    }

    const claimInscribe = () => {
        createOrder()
    }

    useEffect(() => {
        setUserAddressExist('')
    }, [userAddress]);


    const depositCoin = (payAddress, amount, feeRate) => {
        if (selectedwallet === "unisat") {
            depositCoinonUnisat(payAddress, amount, feeRate);
        } else if (selectedwallet === "xverse") {
            depositCoinonXverse(payAddress, amount, feeRate);
        } else if (selectedwallet === "okx") {
            depositCoinonOkx(payAddress, amount, feeRate);
        } else if (selectedwallet === "leather") {
            depositCoinonLeather(payAddress, amount, feeRate);
        }
    };


    const depositCoinonUnisat = async (payAddress, amount, feeRate) => {
        if (accounts[0]) {
            try {
                await unisatUtils.sendBitcoin(payAddress, amount, feeRate)
            } catch (e) {
                toast.error(e.message);
            }
        } else {
            toast.error("Please connect wallet");
        }
    };

    const depositCoinonXverse = async (payAddress, amount, feeRate) => {
        if (address) {
            try {
                const sendBtcOptions = {
                    payload: {
                        network: {
                            type: "Mainnet",
                        },
                        recipients: [
                            {
                                address: payAddress,
                                amountSats: amount
                            },
                        ],
                        senderAddress: address,
                    },
                    onFinish: async (txid) => {

                    },
                    onCancel: () => toast.error("Canceled"),
                };

                await sendBtcTransaction(sendBtcOptions);

            } catch (e) {
                toast.error(e.message);
            }
        } else {
            toast.error("Please connect wallet");
        }
    };

    const depositCoinonOkx = async (payAddress, amount, feeRate) => {
        if (address) {
            try {
                const result = await window.okxwallet.bitcoin.send({
                    from: address,
                    to: payAddress,
                    value: amount,
                });
            } catch (e) {
                toast.error(e.message);
            }
        } else {
            toast.error("Please connect wallet");
        }
    };

    const depositCoinonLeather = async (payAddress, amount, feeRate) => {
        if (address) {
            try {
                const resp = await window.btc?.request("sendTransfer", {
                    address: payAddress,
                    amount: amount
                });
            } catch (e) {
                toast.error(e.error.message);
            }
        } else {
            toast.error("Please connect wallet");
        }
    };


    return (
        <main>
            <div className="inscribe">
                <div className="box">
                    <div className="titlex">
                        <h2>RUNE INSCRIBE</h2>
                        <p>Inscribe RUNE standard tokens</p>
                    </div>

                    <div className='forms-main'>
                        <div className="form">
                            <div>
                                <input
                                    onChange={(e) => {
                                        setUserAddress(e.target.value)
                                    }}
                                    type="text" name="mintAmount" placeholder='Enter your address' className="inputx" />
                            </div>

                            {
                                userAddressCheckExist == 'yes' ? " your address is registered." :
                                    userAddressCheckExist == 'no' ? 'Your address is not registered.' : ''
                            }

                            <div className="next">
                                <button onClick={checkEligibility}>Check Eligibility</button>
                            </div>
                            <div className="line"></div>
                            <div className="alert">
                                <p> button active when the user goes to the page, you can set the initial state, Heres how you can</p>
                            </div>
                            <div className="next">
                                <button onClick={claimInscribe}>Claim</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
