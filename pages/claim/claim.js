import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import CircularProgress from '@mui/material/CircularProgress';
import React, { useState, useEffect, useCallback } from 'react';

import WalletConnectProvider from "@walletconnect/web3-provider";

import walletConnect, {claimReputation} from '../../lib/connect.serv.js';

const infuraConfig = require('../../private/infura.config.js');
const SwitchAndConnectButton = styled(Button)({
    height: "100px",
    width: "100px",
    backgroundSize: "90%",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundColor: "#9c27b0",
    '&.chain-connected': {
        backgroundColor: "#00C3AE",
        '&:hover': {
            backgroundColor: "#049484"
        }
    },
    '&:hover': {
        backgroundColor: "#60156c"
    }
});

const Web3 = require('web3');
let testUrl = infuraConfig.infuraUrl;

export default function Claim(props) {
    const [claimAddress, setClaimAddress] = useState(null);
    const [connectedAddress, setConnectedAddress] = useState(null);
    const [connectedProvider, setConnectedProvider] = useState(null);
    const [errorMessage, setError] = useState(null);
    const [connectedChain, setConnectedChain] = useState(null);
    const [initProvider, setInitProvider] = useState(null);
    const [chainId, setChainId] = useState(null);
    const {onClose, open} = props;
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('idle');
    
    // Chain changed triggered both through app-button and manual through wallet
    const providerInit = useCallback((providerName) => {
            if (providerName == "MM") {
                let web3 = new Web3(Web3.givenProvider || testUrl);
                web3.eth.currentProvider.on('chainChanged', (chainId) => {
                    console.log('chainChanged');
                    setConnectedChain(chainId == "0x7a" ? "Fuse": "Ethereum Mainnet");
                    setChainId(chainId == "0x7a" ? 122 : 1);
                });
                
                web3.eth.currentProvider.on('accountsChanged', (res) => {
                    setConnectedAddress(null);
                    setConnectedProvider(null);
                    setConnectedChain(null);
                    setChainId(null);
                    setError("You have disconnected from the dapp.");
                    setQuery("cancelled");
                    setTimeout(()=> {
                        setQuery('idle');
                    }, 2500)
                });

                return web3;
            } else {   
                const Wc3 = new WalletConnectProvider({
                    infuraId: infuraConfig.infuraId
                });
                
                Wc3.on("disconnect", (code, res) =>{
                    return {
                        errorCode: code
                    }
                });

                return Wc3;


            }
    }, [initProvider]);

    useEffect(() => {
        setClaimAddress(props.proofData.addr); // seperate useEffect?
    }, []);

    const connectForClaim = async (providerName) => {
        // Provider {
        //     "MM" for METAMASK
        //     "WC" for WalletConnect
        // }
        if (query !== 'idle') {
            setQuery('idle');
            return;
        }

        setQuery('loading-connect');
        let conAddr;
        const providerInstance = providerInit(providerName);
        conAddr = walletConnect(providerName, providerInstance);

        conAddr.then((res) => {
            if (res.connectedAddress !== claimAddress) {
                // disconnect by button and/or catch manually disconnecting

                // TODO: manage disconnecting the wrong address
                console.log('sorry, wrong address');
                setError('Sorry, you are not connected to the right address');
                setQuery('wrong-address');
                setTimeout(() => {
                    console.log("setting idle");
                    setQuery('idle');
                }, 2500);
            } else {
                setConnectedAddress(res.connectedAddress);
                setConnectedProvider(providerName);
                setConnectedChain(res.connectedChain);
                setChainId(res.chainId);    
                setQuery('success');
            }

        }).catch((err) => {
            if (err.code == 4001 || err.message == 'User closed modal'){
                setQuery('cancelled');
                setError('You cancelled the connection, try again!');
                setTimeout(() => {
                    setQuery('idle');
                }, 2500);
            }
        });
    }

    // Switching of network by button
    const switchNetwork = async (chainId) => {  
        let web3 = new Web3(Web3.givenProvider || testUrl);
        web3.eth.currentProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainId}]
        });
    }

    // Where to get the abi for the new contract?
    const getReputation = async(chainId) => {
        const claim = claimReputation("abiHere", props.proofData, 
                                      connectedProvider, 
                                      chainId.chainId);
    }

    const handleClose = () => {
        onClose();
    }

    return (
        <Dialog onClose={handleClose} open={open}>
        <DialogContent className="dialogContentContainer" sx={{
            width: "500px",
            height: "max-content",
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
        }}>
        <DialogTitle>You have GOOD Tokens to claim!</DialogTitle>
            <Typography variant="span"> 
                Connect your wallet below. 
                Make sure to connect with your eligible address which is:
            </Typography>
            <Typography variant="span" sx={{fontWeight: "bold", fontStyle: "italic"}}>
                {claimAddress}
            </Typography>
            { !connectedAddress ?
                query === 'loading-connect' ? 
                    <CircularProgress color="secondary" sx={{marginTop:"20px"}} /> 
                :
                    query === 'cancelled' ?
                        <Typography variant="span" color="red">
                            {errorMessage}
                        </Typography> 
                    :
                        query === 'wrong-address' ?
                            // this is a dead-end for now, reload required
                                <Typography color="red">
                                    {errorMessage}
                                </Typography> 
                            :
                <Box sx={{
                    marginTop: "20px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                }}>
                    <SwitchAndConnectButton
                        fullWidth
                        variant="contained"
                        sx={{
                            backgroundImage: `url('/metamask.svg')`, 
                            marginRight: "40px"
                        }}
                        onClick={() => connectForClaim("MM")}></SwitchAndConnectButton>
                    <SwitchAndConnectButton
                        fullWidth
                        variant="contained"
                        sx={{
                            backgroundImage: `url('/walletconnect.svg')`, 
                        }}
                        onClick={() => connectForClaim("WC")}></SwitchAndConnectButton>
                </Box>

                : // First Connect, then >>
                <div>
                    <div>You are currently connected with address:</div>
                    <Typography variant="span" sx={{fontStyle: "italic", fontWeight: "bold"}}>
                        {connectedAddress}
                    </Typography>
                    <div>----------------------</div>
                    <div>On network: 
                    <Typography variant="span" 
                                style={{fontWeight: "bold"}}>
                                {connectedChain}            
                    </Typography>
                    </div>
                    <Box>
                        <Typography variant="span">
                            Make sure you are connected to the network for which 
                            you want to claim (Blue): 
                        </Typography>
                        <SwitchAndConnectButton
                            fullWidth
                            variant="contained"
                            className={`${chainId == 1 ? "chain-connected" : ""}`}
                            sx={{
                                mt: 3,
                                mb: 2,
                                backgroundImage: `url('/ethereum.svg')`,
                            }}
                            onClick={() => switchNetwork("0x1")}
                        ></SwitchAndConnectButton>
                    
                        <SwitchAndConnectButton
                            fullWidth
                            variant="contained"
                            className={`${chainId == 122 ? "chain-connected" : ""}`}
                            sx={{
                                mt: 3,
                                mb: 2,
                                backgroundImage: `url('/fuse.svg')`
                            }}
                                onClick={() => switchNetwork("0x7a")}
                            ></SwitchAndConnectButton>
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
                    </Box>

                </div>
            }
        </DialogContent>

        </Dialog>
    )
}