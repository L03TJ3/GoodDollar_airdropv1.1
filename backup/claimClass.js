import Box from "@mui/material/Grid";
import Button from "@mui/material/Button";
import React, { Component } from 'react';

import walletConnect, {getBalance, networkChangeHandler} from '../../lib/connect.serv.js';
// import ClaimItButton from './claimitnow.js'

class Claim extends Component {
    constructor(props){
        super(props);
        this.state = {
            connectedAddress: null,
            connectedProvider: null,
            connectError: null,
            connectedChain: null
        }
        this.connectForClaim = this.connectForClaim.bind(this);
        this.connectContractTest = this.connectContractTest.bind(this);
        this.switchNetwork = this.switchNetwork.bind(this);
    }

    componentDidMount(){
        console.log("we mounted");
        console.log('initialProps -->', this.props);     
    }

    connectForClaim = async(provider) => {
        let conAddr = walletConnect(provider);
        console.log("conAddr -->", conAddr);
        conAddr.then((res) => {
            console.log("connectForClaim -->", res);
            this.setState({
                connectedAddress: res.connectedAddress,
                connectedProvider: provider,
                connectedChain: res.connectedChain
            })
        }).catch((err) => {
            console.log("error message -->", err);
            if (err.code == 4001){
                this.setState({
                    connectError: err.message
                });
            }
        });

    }
    switchNetwork = async(chainId) => {
        let switched = networkChangeHandler(chainId);
        
        // If switch succesfull, update connectedChain!
        
        // this.setState({
        //     connectedChain: chainId ? 
        // })
    }   

    connectContractTest = async() => {
        let awaitRes = getBalance(this.props.cabiProp, this.state.connectedAddress);
        console.log("test for connecting contract -->", awaitRes);
    }
    
    claimIt = async() => {
        console.log("claimLogic here");
    }

    render() {
        return (
            <div>
                <div>You have GOOD Tokens to claim!</div>
                <div> Claim them below for the following address:</div>
                <div>{this.props.addressForClaim}</div>
                <div>----------</div>
                { !this.state.connectedAddress ?
                    <div>
                        <Box sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center"
                        }}>
                            <Button
                                fullWidth
                                variant="contained"
                                sx={
                                {
                                    mt: 3, 
                                    mb: 2,
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
                                onClick={() => this.connectForClaim("MM")}
                                >
                            </Button>
                            <Button
                                fullWidth
                                variant="contained"
                                sx={
                                {
                                    mt: 3, 
                                    mb: 2,
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
                                onClick={() => this.connectForClaim("WC")}
                                >
                            </Button>
                        </Box>
                    </div>

                    : // First Connect, Then >> 

                    <div>
                        <div> You are currently connected with address:</div> 
                        <div>{this.state.connectedAddress}</div>
                        <div> On network: {this.state.connectedChain}</div>
                        <Box>
                            <div>Switch to:</div>
                            <Button
                                fullWidth
                                variant="contained"
                                sx={
                                {
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
                                }}}
                                onClick={() => this.switchNetwork(1)}
                            ></Button>
                                                        <Button
                                fullWidth
                                variant="contained"
                                sx={
                                {
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
                                onClick={() => this.switchNetwork(122)}
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
                                    backgroundColor: "#9c27b0", 
                                    '&:hover': {
                                        backgroundColor: "#60156c"
                                }}}
                                onClick={this.connectContractTest}
                                >
                                Claim your tokens
                            </Button>
                        </Box>
                    </div>
                }
                <div>{this.state.connectError ? this.state.connectError : null}</div>

            </div>
        )
    }
}

export default Claim;





// const DynamicConnect = {props} = dynamic(
//     import('../../lib/connect.js').then((res) => res.Connect),
//     { ssr: false }); 

// export default function Claim() {
//         return (
//             <div>
//                 <div>You have GOOD Tokens to claim!</div>
//                 <div> Claim them below for the following address:</div>
//                 <DynamicConnect></DynamicConnect>
//                 <Box>
//                     <Button
//                         fullWidth
//                         variant="contained"
//                         sx={
//                             {
//                             mt: 3, 
//                             mb: 2, 
//                             backgroundColor: "#9c27b0", 
//                             '&:hover': {
//                                 backgroundColor: "#60156c"
//                             }}}
//                         onClick={() => {
//                         }}>
//                         Claim your tokens
//                     </Button>
//                 </Box>
//             </div>
//         )
// }

// export async function connectWallet(){
//     const connect = require("../../lib/connect.js");
//     const awaitRes = connect.Connect();
//     const connectedAddress = awaitRes;
    
//     console.log("awaitRes -->", awaitRes);
//     console.log("connectedAddress -->", connectedAddress);
//     return {
//         props: {
//             connectedAddress
//         }
//     }
// }