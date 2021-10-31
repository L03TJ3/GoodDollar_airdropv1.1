import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";
import CircularProgress from '@mui/material/CircularProgress';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import WalletConnectProvider from "@walletconnect/web3-provider";

import walletConnect, {claimReputation} from '../../lib/connect.serv.js';

const infuraConfig = require('../../private/infura.config.js');

const Web3 = require('web3');
let testUrl = infuraConfig.infuraUrl;


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

const ErrorSpan = ({message}) => {
    return (
        <Typography className="when-triggered" variant="span" color="red">
            {message}
        </Typography> 
    );
}

export default function Claim(props) {
    const [claimAddress, setClaimAddress] = useState(null);
    const [connectedAddress, setConnectedAddress] = useState(null);
    const [connectedProvider, setConnectedProvider] = useState(null);
    const [errorMessage, setError] = useState(null);
    const [connectedChain, setConnectedChain] = useState(null);
    const [initProvider, setInitProvider] = useState('init');
    const [chainId, setChainId] = useState(null);
    const {onClose, open} = props;
    // const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('idle');
    const [gRep, setGRep] = useState(null);
    const [providerInstance, setProviderInstance] = useState(null);

    let processingQuery = ['cancelled', 'wrong-address'].join(":");


    // This should be with one useEffect?
    
    const connectedAddressRef = useRef(connectedAddress);
    const connectedChainRef = useRef(connectedChain);
    const providerInstanceRef = useRef(providerInstance);
    const claimAddressRef = useRef(claimAddress);
    
    useEffect(() => {
        connectedChainRef.current = connectedChain;
    }, [connectedChain]);

    useEffect(() => {
        connectedAddressRef.current = connectedAddress;
    }, [connectedAddress]);

    useEffect(() => {
        providerInstanceRef.current = providerInstance;
    }, [providerInstance]);

    useEffect(() => {
        claimAddressRef.current = claimAddress;
    }, [claimAddress]);
     
    
    // Chain changed triggered both through app-button and manual through wallet
    const providerInit = useCallback((providerName, providerInstance) => {
        console.log("how many? -->", providerName);
        console.log("providerinstance providerInit -->", providerInstance);
        if (providerName == "MM") {
            let supportedChains = ['0x7a', '0x1', 1, 122].join(':');
            // Temporary, events might not be properly initialized?
            
            // Docs state that a window reload is recommended?
            providerInstance.eth.currentProvider.on('chainChanged', (chainId) => {
                if (supportedChains.indexOf(chainId) !== -1) {
                    setError(null);
                    setQuery('idle');
                    setConnectedChain(chainId == "0x7a" ? "Fuse": "Ethereum Mainnet");
                    setChainId(chainId == "0x7a" ? 122 : 1);
                } else {
                    let res = {
                        connectedChain: connectedChainRef.current,
                        chainId: chainId,
                        connectedAddress: connectedAddressRef.current,
                    };
                    wrongNetwork(res, providerName);
                }
            });


            // TODO: Handle connection of multiple accounts
            providerInstance.eth.currentProvider.on('accountsChanged', (res) => {
                console.log('metamask disconnect');
                disconnect();
            });
        } else {
            providerInstance.on("disconnect", (code, res) =>{
                // code 1000 == disconnect
                console.log('wc disconnect');
                disconnect();
  
            });
        }
    }, [initProvider]);

    // Check if user is already connected with metamask on initialization.
    // TODO: Check for Wallet-Connect access token
    useEffect(() => {
        setClaimAddress(props.proofData.addr);
        let gRep = props.proofData.reputationInWei / 1e18;
        setGRep(gRep);

        let web3 = new Web3(Web3.givenProvider || testUrl);
        // const Wc3 = new WalletConnectProvider({
        //     infuraId: infuraConfig.infuraId
        // });

        web3.eth.getAccounts().then((res) => {
            if (res.length !== 0){
                let providerName = "MM";
                setConnectedAddress(res[0]);
                setProviderInstance(web3);
                providerInit(providerName, providerInstanceRef.current);
                connectForClaim(providerName);
            }
        });

        
        // Check here if there is an existing Wallet-Connect connection
        // TODO: WC and Metamask should not? be able to be both connected


    }, [providerInit]);

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
        if (!providerInstance && providerName == "MM"){
            console.log("initialize when not exists");
            const web3 = new Web3(Web3.givenProvider || testUrl);
            setProviderInstance(web3);
            providerInit(providerName, web3);
            conAddr = walletConnect(providerName, web3);
        } else if (providerInstance && providerName == "MM") {
            conAddr = walletConnect(providerName, providerInstanceRef.current);
        } else {
            const Wc3 = new WalletConnectProvider({
                infuraId: infuraConfig.infuraId
            });
            setProviderInstance(Wc3);
            providerInit(providerName, Wc3);
            conAddr = walletConnect(providerName, Wc3);

        }

        conAddr.then((res) => {
            console.log('connect response -->', res);
            if (res.connectedAddress !== claimAddressRef.current) {
                // disconnect by button and/or catch manually disconnecting

                // TODO: manage disconnecting the wrong address. Answer: Can only be done by user
                console.log('sorry, wrong address');
                setError('Sorry, you are not connected to the right address. '+ 
                         'Please disconnect first, then retry with the eligible address.');
                setQuery('wrong-address');
            } else {
                success(res, providerName);
            }

        }).catch((err) => {
            console.log('errorrrr -->', err);
            if (err.message == 'User closed modal'){
                err.code = 311;
            }

            switch (err.code) {
                case 4001, 311: 
                    cancelled();
                    break;
                case -32002: 
                    pending();
                    break;
                case 310:
                    wrongNetwork(err, providerName);
                    break;
            } 
        });
    }

    // Switching of network by button
    const switchNetwork = async (chainId) => {  
        let web3 = new Web3(Web3.givenProvider || testUrl);
        web3.eth.currentProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainId}]
        }).then(() => {
            // returns nothing
        }).catch((err) => {
            switch (err.code) {
                case -32002:
                    pending();
                    break;
                case 4001:
                    cancelled();
                    break;
            }
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

    const success = (res, providerName) => {
        setConnectedChain(res.connectedChain);
        setChainId(res.chainId);
        setConnectedAddress(res.connectedAddress);
        setConnectedProvider(providerName);  
        setQuery('success');  
    }
    
    const wrongNetwork = (res, providerName) => {
        if (query !== 'success') {
            success(res, providerName);
        };

        setError('Sorry, you seem to be connected to an unsupported network');
        setConnectedChain('unsupported');
        setChainId('0x00');
        setQuery('wrong-network');
    }

    const pending = () => {
        setError('There is already an pending confirmation in your MetaMask.');
        setQuery('pending');
        setTimeout(() => {
            setError(null);
            setQuery('idle');
        }, 2500);
    }

    const cancelled = () => {
        setQuery('cancelled');
        setError('You cancelled the connection/confirmation, try again!');
        setTimeout(() => {
            setError(null);
            setQuery('idle');
        }, 2500);
    }

    const disconnect = () => {
        setConnectedAddress(null);
        setConnectedProvider(null);
        setConnectedChain(null);
        setChainId(null);
        setError("you have disconnected from the dapp");
        setQuery("cancelled");
        setTimeout(() => {
            setError(null);
            setQuery('idle');
        }, 2500);
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
        <DialogTitle>You have {gRep} GOOD Tokens to claim!</DialogTitle>
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
                    processingQuery.indexOf(query) !== -1 ?
                        <ErrorSpan message={errorMessage} />
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
                    query === 'pending' ?
                        <ErrorSpan message={errorMessage} />
                    :
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
                        <br />                         
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
                    {
                        query === 'wrong-network' ? 
                            <ErrorSpan message={errorMessage} />
                        :
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
                    }
                </div>
            }
        </DialogContent>

        </Dialog>
    )
}