import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import Modal from 'react-modal';
import FacebookLogin from 'react-facebook-login';
import GoogleLogin from 'react-google-login';
import axios from 'axios';

import '../Styles/header.css';

const constants = require('../constants');
const API_URL = constants.API_URL;

const customStyles = {
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        width: '450px'
    },
};

Modal.setAppElement('#root');

class Header extends Component {

    constructor() {
        super();
        this.state = {
            backgroundStyle: '',
            isLoginModalOpen: false,
            isSignupModalOpen: false,
            username: '',
            password: '',
            firstName: '',
            lastName: '',
            user: undefined,
            isLoggedIn: false,
            loginError: undefined,
            signUpError: undefined
        };
    }

    componentDidMount() {
        const initialPath = this.props.history.location.pathname;
        this.setHeaderStyle(initialPath);

        this.props.history.listen((location, action) => {
            this.setHeaderStyle(location.pathname);
        });
    }

    setHeaderStyle = (path) => {
        let bg = '';
        if (path === '/' || path === '/home') {
            bg = 'transparent';
        } else {
            bg = 'coloured';
        }
        this.setState({
            backgroundStyle: bg
        });
    }

    goToHome = () => {
        this.props.history.push('/');
    }

    openLoginModal = () => {
        this.setState({
            isLoginModalOpen: true
        });
    }

    closeLoginModal = () => {
        this.setState({
            isLoginModalOpen: false
        });
    }

    loginHandler = (event) => {
        // check the value, show the message
        event.preventDefault();
        const { username, password } = this.state;
        const obj = {
            username: username,
            password: password
        };
        axios({
            url: `${API_URL}/api/login`,
            method: 'POST',
            headers:{'Content-Type':'application/json'},
            data: obj
        }).then((result) => {
            console.log(result);
            localStorage.setItem("loggedInUserName", result.data.firstName);
            localStorage.setItem("isLoggedIn", true);
            alert(result.data.message);
            this.setState({
                firstName: result.data.firstName,
                isLoginModalOpen: false
            });
        }).catch(err => {
            this.setState({
                isLoggedIn: false,
                loginError: "Username or password is wrong"
            });
        })
    }

    loginCancelHandler = () => {
        this.closeLoginModal();
    }

    openSignupModal = () => {
        this.setState({
            isSignupModalOpen: true,
            firstName: '',
            lastName: '',
            username: '',
            password: ''
        })
    }

    closeSignupModal = () => {
        this.setState({
            isSignupModalOpen: false
        });
    }

    signupHandler = (event) => {
        event.preventDefault();
        const { firstName, lastName, username, password } = this.state;
        const reqObject = {
            email: username,
            password,
            firstName,
            lastName
        }
        axios({
            url: `${API_URL}/api/signUp`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            data: reqObject
        }).then(response => {
            alert(response.data.message);
            this.setState({
                isSignupModalOpen: false,
                firstName: '',
                lastName: '',
                username: '',
                password:''
            });
        }).catch(error => console.log(error));
    }

    signupCancelHandler = () => {
        this.closeSignupModal();
    }

    responseFacebook = () => {

    }

    responseGoogle = (response) => {
        localStorage.setItem('loggedInUserName', response.profileObj.name);
        localStorage.setItem('loggedInUserEmail', response.profileObj.email);
        localStorage.setItem('isLoggedIn', true);
        this.setState({ isLoginModalOpen: false })
    }

    toggleAuth = (auth) => {
        if (auth === 'login') {
            this.signupCancelHandler();
            this.openLoginModal();
        } else {
            this.loginCancelHandler();
            this.openSignupModal();
        }
    }

    handleChange = (e, field) => {
        const val = e.target.value;
        this.setState({
            [field]: val,
            loginError: undefined,
            signUpError: undefined
        });
    }

    logout = () => {
        localStorage.clear();
        this.setState({
            user: undefined,
            isLoggedIn: false
        });
    }

    render() {
        const { backgroundStyle, isLoginModalOpen, isSignupModalOpen, username, password, firstName, lastName } = this.state;
        let isLoggedIn = localStorage.getItem('isLoggedIn');
        let userName = localStorage.getItem('loggedInUserName');
        return (
            <React.Fragment>
                <div className="header" style={{ 'background': backgroundStyle === 'transparent' ? 'transparent' : '#eb2929' }}>
                    <div className="container">
                        <div className="row">
                            <div className="logoSection col-6">
                                {
                                    backgroundStyle === 'transparent'
                                        ?
                                        null
                                        :
                                        <div className="logo-small" onClick={this.goToHome}>e!</div>
                                }

                            </div>
                            <div className="loginSection col-6">
                                {
                                    isLoggedIn 
                                    ?
                                    <>
                                        <span className="text-white m-4">{userName}</span>
                                        <button className="signup-button" onClick={this.logout}>Logout</button>
                                    </>
                                    :
                                    <>
                                        <button className="login-button" onClick={this.openLoginModal}>Login</button>
                                        <button className="signup-button" onClick={this.openSignupModal}>Create an account</button>
                                    </>
                                }
                            </div>
                        </div>
                    </div>
                </div>
                <Modal isOpen={isLoginModalOpen} style={customStyles}>
                    <h2 className="popup-heading">
                        Login
                        <button className="float-end btn btn-close mt-2" onClick={this.closeLoginModal}></button>
                    </h2>
                    <form className="my-4">
                        <input className="form-control" type="text" placeholder="Email" value={username} required onChange={(e) => this.handleChange(e, 'username')}/>
                        <input className="form-control my-2" type="password" placeholder="Password" value={password} required onChange={(e) => this.handleChange(e, 'password')}/>
                        <button className="btn form-control login-btn" onClick={this.loginHandler}>Login </button>
                        <button className="btn form-control" onClick={this.loginCancelHandler}>Cancel</button>
                    </form>
                    <div className="text-center mt-2">
                        <FacebookLogin 
                            appId=""
                            textButton="Continue with Facebook"
                            autoLoad={true}
                            fields="name,email,picture"
                            callback={this.responseFacebook}
                            cssClass="my-facebook-button-class mb-2"
                            icon="fa-facebook"
                        />
                        <GoogleLogin 
                            clientId="120836062525-2lartvq67l7lev6talsjm9deu3id9ifr.apps.googleusercontent.com"
                            buttonText="Continue with Google"
                            onSuccess={this.responseGoogle}
                            onFailure={this.responseGoogle}
                            cookiePolicy={'single_host_origin'}
                            className="my-facebook-button-class"
                        />
                    </div> 
                    <hr className="mt-5"/>
                    <div className="bottom-text">
                        Don’t have account? <button className="text-danger btn m-0 p-0" onClick={() => this.toggleAuth('signup')}>Sign UP</button>
                    </div>
                </Modal>

                <Modal isOpen={isSignupModalOpen} style={customStyles}>
                    <h2 className="popup-heading">
                        Create an account
                        <button className="float-end btn btn-close mt-2" onClick={this.closeSignupModal}></button>
                    </h2>
                    <form className="my-4">
                        <input className="form-control" type="text" placeholder="Firstname" value={firstName} onChange={(e) => this.handleChange(e, 'firstName')}/>
                        <input className="form-control my-2" type="text" placeholder="Lastname" value={lastName} onChange={(e) => this.handleChange(e, 'lastName')}/>
                        <input className="form-control" type="email" placeholder="Email" value={username} onChange={(e) => this.handleChange(e, 'username')}/>
                        <input className="form-control my-2" type="password" placeholder="Password" value={password} onChange={(e) => this.handleChange(e, 'password')}/>
                        <button className="btn form-control login-btn" onClick={this.signupHandler}>Create account</button>
                        <button className="btn form-control" onClick={this.signupCancelHandler}>Cancel</button>
                    </form>
                    <div className="text-center mt-2">
                        <FacebookLogin 
                            appId=""
                            textButton="Continue with Facebook"
                            autoLoad={true}
                            fields="name,email,picture"
                            callback={this.responseFacebook}
                            cssClass="my-facebook-button-class mb-2"
                            icon="fa-facebook"
                        />
                        <GoogleLogin 
                            clientId=""
                            buttonText="Continue with Google"
                            onSuccess={this.responseGoogle}
                            onFailure={this.responseGoogle}
                            cookiePolicy={'single_host_origin'}
                            className="my-facebook-button-class"
                        />
                    </div> 
                    <hr className="mt-5"/>
                    <div className="bottom-text">
                        Already have an account? <button className="text-danger btn m-0 p-0" onClick={() => this.toggleAuth('login')}>Login</button>
                    </div>
                </Modal>

            </React.Fragment>
        )
    }
}

export default withRouter(Header);
