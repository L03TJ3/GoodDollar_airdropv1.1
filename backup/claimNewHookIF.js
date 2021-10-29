import Box from "@mui/material/Grid";
import Button from "@mui/material/Button";
import React, { useState, useEffect, useCallback } from 'react';

import walletConnect, {claimReputation} from '../../lib/connect.serv.js';

export default function Claim(props) {
    const [connectedAddress, setConnectedAddress] = useState(null);
    const [claimAddress, setClaimAddress] = useState(null);
    const [connectedProvider, setConnectedProvider] = useState(null);
    const [connectError, setConnectError] = useState(null);
    const [connectedChain, setConnectedChain] = useState(null);
    const [initChainChanged, setInitChainChanged] = useState("init");
    const [chainId, setChainId] = useState(null);

    const Web3 = require('web3');
    let testUrl = "wss://mainnet.infura.io/ws/v3/b6ba453cce1f409c95ecf0caa0a5c3ed";
    let web3 = new Web3(Web3.givenProvider || testUrl);
 
    const chainChangedInit = useCallback(() => {
        web3.eth.currentProvider.on('chainChanged', (chainId) => {
            console.log('chainChanged');
            setConnectedChain(chainId == "0x7a" ? "Fuse": "Ethereum Mainnet");
            setChainId(chainId == "0x7a" ? 122 : 1);
        });
    }, [initChainChanged]);

    useEffect(() => {
        setClaimAddress(props.proofData.addr);
        chainChangedInit();
    }, [chainChangedInit]);

    const connectForClaim = async (provider) => {
        let conAddr = walletConnect(provider, web3);
        conAddr.then((res) => {
            setConnectedAddress(res.connectedAddress);
            setConnectedProvider(provider);
            setConnectedChain(res.connectedChain);
            setChainId(res.chainId);
        });
    }

    const switchNetwork = async (chainId) => {            
        web3.eth.currentProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainId}]
        });
    }

    const getReputation = async(chainId) => {
        const claim = claimReputation("abiHere", props.proofData, 
                                      connectedProvider, 
                                      chainId.chainId);
    }

    return (
        <div>
            <div>You have GOOD Tokens to claim!</div>
            <div> Claim them below for the following address:</div>
            <div>{claimAddress}</div>
            <div>-----------</div>
            {/* Set buttons in loop on dataset, prevent duplicates */}
            { !connectedAddress ?
                <div>
                    <Box sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center"
                    }}>
                        <Button
                            fullWidth
                            variant="contained"
                            sx={{
                                backgroundImage: `url('/metamask.svg')`, 
                                height: "100px",
                                width: "100px",
                                marginRight: "40px",
                                backgroundSize: "90%",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "center",
                                backgroundColor: "#9c27b0",
                                '&:hover': {
                                    backgroundColor: "#60156c"
                            }}}
                            onClick={() => connectForClaim("MM")}></Button>
                        <Button
                            fullWidth
                            variant="contained"
                            sx={{
                                backgroundImage: `url('/walletconnect.svg')`, 
                                height: "100px",
                                width: "100px",
                                backgroundSize: "90%",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "center",
                                backgroundColor: "#9c27b0",
                                '&:hover': {
                                    backgroundColor: "#60156c"
                            }}}
                            onClick={() => connectForClaim("WC")}></Button>
                    </Box>
                </div>

                : // First Connect, then >>
                
                <div>
                    <div>You are currently connected with address:</div>
                    <div>{connectedAddress}</div>
                    <div>On network: {connectedChain}</div>
                    {
                        connectedAddress === claimAddress ?
                        <div>
                        <Box>
                        <div>Make sure you are connected to the right network for which 
                        you want to claim: </div>
                        <Button
                            fullWidth
                            variant="contained"
                            sx={{
                                mt: 3,
                                mb: 2,
                                backgroundImage: `url('/ethereum.svg')`,
                                height: "100px",
                                width: "100px",
                                backgroundSize: "90%",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "center",
                                backgroundColor: "#9c27b0",
                                '&:hover': {
                                    backgroundColor: "#60156c"
                                }
                            }}
                            onClick={() => switchNetwork("0x1")}
                        ></Button>
                    
                        <Button
                            fullWidth
                            variant="contained"
                            sx={{
                                mt: 3,
                                mb: 2,
                                backgroundImage: `url('/fuse.svg')`,
                                height: "100px",
                                width: "100px",
                                backgroundSize: "90%",
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "center",
                                backgroundColor: "#9c27b0",
                                '&:hover': {
                                    backgroundColor: "#60156c"
                                }}}
                                onClick={() => switchNetwork("0x7a")}
                            ></Button>
                    </Box>
                    <Box>
                        <Button
                            fullWidth
                            variant="contained"
                            sx={
                            {
                                mt: 3, 
                                mb: 2, 
                                backgroundColor: "#00C3AE", 
                                '&:hover': {
                                    backgroundColor: "#049484"
                            }}}
                            onClick={() => getReputation({chainId})}
                            >
                            Claim your tokens
                        </Button>
                    </Box></div> : 
                    <div>You are not connected with the correct wallet</div>
                    }


                </div>
            }
        </div>
    )
}