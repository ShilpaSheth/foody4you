import React, { Component } from 'react';
import { Carousel } from 'react-responsive-carousel';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import axios from 'axios';
import queryString from 'query-string';
import Modal from 'react-modal';

import 'react-tabs/style/react-tabs.css';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import '../Styles/details.css';

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
        width: '660px',
        maxHeight: '700px'
    },
};

Modal.setAppElement('#root');

export default class Details extends Component {

    constructor() {
        super();
        this.state = {
            restaurant: null,
            isMenuModalOpen: false,
            menu: [],
            totalPrice: 0,
            subtotal:0,
            orderedItems: [],
            email: undefined,
            name: undefined,
            phone: undefined,
            address: undefined,
            isPaymentFormOpen: false
        };
    }

    componentDidMount() {
        const qs = queryString.parse(this.props.location.search);
        const { id } = qs;

        axios.get(`${API_URL}/api/getRestaurantById/${id}`)
            .then(result => {
                this.setState({
                    restaurant: result.data.restaurant
                });
            })
            .catch(error => {
                console.log(error);
            });

        // get the menu for this restaurant
        axios.get(`${API_URL}/api/getMenuByRestaurant/${id}`)
            .then(result => {
                this.setState({
                    menu: result.data.menu
                });
            })
            .catch(error => {
                console.log(error);
            });
        
    }

    openMenuHandler = () => {
        this.setState({
            isMenuModalOpen: true
        });

        
    }

    closeMenuModal = () => {
        this.setState({
            isMenuModalOpen: false
        });
    }

    // addItemHandler = (item) => {
    //     const { totalPrice } = this.state;
    //     this.setState({
    //         totalPrice: totalPrice + item.itemPrice
    //     })
    // }

    addItems = (index, operationType) => {
        let total = 0;
        const items = [...this.state.menu];
        const item = items[index];

        if (operationType === 'add') {
            item.qty += 1;
        } else {
            item.qty -= 1;
        }
        items[index] = item;
        items.map((item) => {
            return total += item.qty * item.itemPrice;
        })
        this.setState({menu:items, subtotal:total, orderedItems:items.filter(order=>order.qty>0)})
    }

    paymentForm = () => {
        this.setState({isPaymentFormOpen: true, isMenuModalOpen: false})
    }

    handleInputChange = (e) => {
        this.setState({ [e.target.name]: e.target.value });
    }


    getCheckSum(data) {
        return fetch(`${API_URL}/api/payment`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                "Content-Type": 'application/json'
            },
            body: JSON.stringify(data)
        }).then(result => {
            return result.json();
        }).catch(err => {
            console.log(err);
        })
    }

    isObj = (val) => {
        return typeof val === 'object';
    }

    isDate = (val) => {
        return Object.prototype.toString.call(val) === '[object Date]';
    }

    stringifyValue = (value) => {
        if (this.isObj(value) && !this.isDate(value)) {
            return JSON.stringify(value);
        } else {
            return value;
        }
    }

    buildForm = (details) => {
        const { action, params } = details;
        const form = document.createElement('form');
        form.setAttribute('method', 'post');
        form.setAttribute('action', action);
        Object.keys(params).forEach(key => {
            const input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', key);
            input.setAttribute('value', this.stringifyValue(params[key]));
            form.appendChild(input);
        });
        return form;
    }

    postTheInformation = (information) => {
        // you can post the payment and order related information to paytm gateway only through an HTML form
        // How will you create an HTML form in the Javascript - DOM manipulation

        // first we will create a form and then we will post the form to Paytm
        const form = this.buildForm(information);

        // attach form to the document body
        document.body.appendChild(form);

        // submit
        form.submit();

        // destroy the form
        form.remove();

    }

    paymentHandler = () => {
        const { email, subtotal} = this.state;
        // Pyament integration logic

        //(1) make API call to the BE /payment and get the payment cheksum
        //(2) go to the paytm website

        const data = {
            amount: subtotal,
            email: email
        };
        console.log(data);

        this.getCheckSum(data)
            .then(result => {
                let information = {
                    action: 'https://securegw-stage.paytm.in/order/process',
                    params: result
                }
                this.postTheInformation(information);
            })
            .catch(error => {
                console.log(error);
            })
    }

    render() {
        const { restaurant, isMenuModalOpen, menu, subtotal, email, name, phone, address, isPaymentFormOpen } = this.state;
        return (
            <div className="container details">
                {
                    restaurant
                    ?
                    <div>
                        <div className="images">
                            <Carousel showThumbs={false}>
                                {
                                    restaurant.thumb.map((item, index) => {
                                        return (
                                            <div>
                                                <img key={index} src={require('../' + item).default} alt="not found" />
                                            </div>
                                        )
                                    })
                                }
                            </Carousel>
                        </div>
                        <div className="restName my-3">
                            { restaurant.name }
                            <button className="btn btn-danger float-end mt-4" onClick={this.openMenuHandler}>Place Online Order</button>
                        </div>
                        <div className="myTabs mb-5">
                            <Tabs>
                                <TabList>
                                    <Tab>Overview</Tab>
                                    <Tab>Contact</Tab>
                                </TabList>

                                <TabPanel>
                                    <div className="about my-5">About this place</div>
                                    <div className="cuisine">Cuisine</div>
                                    <div className="cuisines">
                                        {
                                            restaurant.cuisine.map((item, index) => {
                                                return <span key={index}>{ item.name },</span>
                                            })
                                        }
                                    </div>
                                    <div className="cuisine mt-3">Average Cost</div>
                                    <div className="cuisines"> &#8377; { restaurant.min_price } for two people (approx.)</div>
                                </TabPanel>
                                <TabPanel>
                                    <div className="cuisines my-5">Phone Number
                                        <div className="text-danger">{ restaurant.contact_number }</div>
                                    </div>
                                    <div className="cuisine mt-4">{ restaurant.name }</div>
                                    <div className="text-muted mt-2">
                                        { restaurant.locality }, 
                                        <br/>
                                        { restaurant.city }
                                    </div>
                                </TabPanel>
                            </Tabs>
                        </div>
                        <Modal isOpen={isMenuModalOpen} style={customStyles}>
                            <h2 className="popup-heading">
                                { restaurant.name }
                                <button className="float-end btn btn-close mt-2" onClick={this.closeMenuModal}></button>
                                <ul className="menu">
                                    {
                                        menu.map((item, index) => {
                                            return (
                                                <li key={index}>
                                                    <div className="row no-gutters menuItem">
                                                        <div className="col-10">
                                                            {
                                                                item.isVeg
                                                                ?
                                                                <div className="text-success fs-6">Veg</div>
                                                                :
                                                                <div className="text-danger fs-6">Non-Veg</div>
                                                            }
                                                            <div className="cuisines">{ item.itemName }</div>
                                                            <div className="cuisines">&#8377;{ item.itemPrice }</div>
                                                            <div className="cuisines">{ item.itemDescription }</div>
                                                        </div>
                                                        <div className="col-2">
                                                        {item.qty === 0
                                                            ? <div><button className='btn btn-light add-button' onClick={() => this.addItems(index, 'add')}>Add</button></div>
                                                            : <div className='add-number'>
                                                                <button className='minus-button' onClick={() => this.addItems(index, 'subtract')}>-</button>
                                                                <span className='item-qty'>{item.qty}</span>
                                                                <button className='plus-button' onClick={() => this.addItems(index, 'add')}>+</button>
                                                            </div>
                                                        }
                                                            {/* <button className="btn btn-light addButton" onClick={() => this.addItemHandler(item)}>Add</button> */}
                                                        </div>
                                                    </div>
                                                </li>
                                            )
                                        })
                                    }
                                </ul>
                                <div className="mt-3 restName fs-4">
                                    Subtotal <span className="m-4">&#8377; { subtotal }</span>
                                    <button className="btn btn-danger float-end" onClick={this.paymentForm}>Pay Now</button>
                                </div>
                            </h2>
                            </Modal>
                            
                            <Modal isOpen={isPaymentFormOpen} style={customStyles}>
                                <div className='payment-form'>
                                    <h4 className='payment-form-title'>Please fill this form to proceed for payment</h4>
                                    <input required className='payment-form-input' name='email' type='email' placeholder='Enter your Email' value={email} onChange={this.handleInputChange} />
                                    <input className='payment-form-input' name='name' type='email' placeholder='Enter your Name' value={name} onChange={this.handleInputChange} />
                                    <input className='payment-form-input' name='phone' type='email' placeholder='Enter your Phone number' value={phone} onChange={this.handleInputChange} />
                                    <input className='payment-form-input' name='address' type='email' placeholder='Enter your address' value={address} onChange={this.handleInputChange} />
                                    <button className='btn btn-dark payment-form-btn' onClick={this.paymentHandler}>Proceed to Pay</button>
                                </div>
                            </Modal>
                    </div>
                    :
                    null
                }
            </div>
        )
    }
}
