import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import '../Styles/filter.css';
import queryString from 'query-string';
import axios from 'axios';

const constants = require('../constants');
const API_URL = constants.API_URL;

class Filter extends Component {

    constructor() {
        super();
        this.state = {
            mealType: '',
            mealTypeId: 0,
            locations: [],
            selectedCityName: '',
            locationsInCity: [],
            selectedLocation: undefined,
            pageNo: 1,
            restaurantList: [],
            totalResults: 0,
            noOfPages: 0,
            cuisines: [],
            hCost: undefined,
            lCost: undefined,
            sortOrder: 1,
            locationId: undefined
        }
    }

    componentDidMount() {
        const qs = queryString.parse(this.props.location.search);
        const { mealType, mealTypeId, locationId } = qs;
        this.setState({
            mealType: mealType,
            mealTypeId: mealTypeId,
            locationId
        });

       // get list of locations and filter by city_id
        axios.get(`${API_URL}/api/getAllLocations`)
            .then(result => {
                const locations = result.data.locations;
                let selectedCity;
                if (!locationId) {
                    selectedCity = 'All locations';
                } else {
                    selectedCity = locations.find(city => city.location_id == locationId).city;
                }
                // const selectedCityLocations = locations.filter(city => city.location_id === location_id);
                this.setState({
                    locations: result.data.locations,
                 selectedCityName: selectedCity,
                //    locationsInCity: selectedCityLocations,
                //    selectedLocation: selectedCityLocations[0].location_id
                });
                // setTimeout(() => {
                //     this.filterRestaurants();
                // }, 0);
            })
            .catch(error => {
                console.log(error);
            });
        
        const reqObject = {
            mealtype: mealTypeId,
            location: locationId
        }
        axios.post(`${API_URL}/api/filterRestaurants`, reqObject)
            .then(response => {
                const totalResults = response.data.totalResultsCount;
                const pageSize = response.data.pageSize;
                const noOfPages = Math.ceil((totalResults/pageSize));
                this.setState({
                    pageNo: response.data.pageNo,
                    restaurantList: response.data.restaurants,
                    totalResults: totalResults,
                    noOfPages: noOfPages
                })
        })
    // axios({
    //     url: `${API_URL}/api/getAllLocations`,
    //     method: 'GET',
    //     headers: {'Content-Type':'application/json'},
    // }).then(response=>{
    //     console.log("Application Successfully");
    // }).catch(err=>{
    //     console.log("Error");
    // })
     }

    handleLocationChange(e) {
        const { locations } = this.state;
        let currentLocation = e.target.value;
        currentLocation = currentLocation === '0' ? undefined : currentLocation;
        //const {}=this.state
        let selectedCity;
        if (currentLocation === '0') {
            selectedCity = 'All locations';
        } else {
            selectedCity = locations.find(city => city.location_id == currentLocation).city;
        }
        this.setState({
            selectedLocation: currentLocation,
            selectedCityName: selectedCity
        });
        setTimeout(() => {
            this.filterRestaurants();
        }, 0);
    }

    handleCuisineChange(e, cuisine) {
        let { cuisines } = this.state;
        const newCuisines = [...cuisines];
        console.log(cuisines);

        if (cuisines.includes(cuisine)) {
            const cuisineIndex = cuisines.indexOf(cuisine);
            newCuisines.splice(cuisineIndex, 1);
        } else {
            newCuisines.push(cuisine);
        }
        this.setState({
            cuisines: newCuisines
        });
        setTimeout(() => {
            this.filterRestaurants();
        }, 0);
    }

    handleCostChange(e, lCost, hCost) {
        this.setState({
            hCost: hCost,
            lCost: lCost
        });
        setTimeout(() => {
            this.filterRestaurants();
        }, 0);
    }

    handleSort(e, direction) {
        this.setState({
            sortOrder: direction
        });
        setTimeout(() => {
            this.filterRestaurants();
        }, 0);
    }

    handlePageChange(pageno) {
        if (pageno < 1) return;
        this.setState({
            pageNo: pageno
        });
        setTimeout(() => {
            this.filterRestaurants();
        }, 0);
    }

    filterRestaurants() {
        const { mealTypeId, selectedLocation, pageNo, cuisines, hCost, lCost, sortOrder } = this.state;

        // make filter API call to filter the restaurants
        const req = {
            mealtype: mealTypeId,
            location: selectedLocation,
            page: pageNo,
            cuisine: cuisines.length === 0 ? undefined : cuisines,
            lcost: lCost,
            hcost: hCost,
            sort: sortOrder
        };

        axios({
            method: 'POST',
            url: `${API_URL}/api/filterRestaurants`,
            headers: { 'Content-Type': 'application/json' },
            data: req
        }).then(result => {
            const totalResults = result.data.totalResultsCount;
            const pageSize = result.data.pageSize;
            const noOfPages = Math.ceil((totalResults/pageSize));
            this.setState({
                pageNo: result.data.pageNo,
                restaurantList: result.data.restaurants,
                totalResults: totalResults,
                noOfPages: noOfPages
            });
        }).catch(error => {
            console.log(error);
        })
    }

    goToRestaurant(item) {
        const url = `/details?id=${item._id}`;
        this.props.history.push(url);
    }

    getPages = () => {
        const { noOfPages } = this.state;
        let pages = [];
        for(let i = 0; i < noOfPages; i++) {
            pages.push(<div key={i} onClick={() => this.handlePageChange(i + 1)} className="pagination-button">{ i + 1 }</div>)
        }
        return pages;
    }

    render() {
        const { mealType, locations, selectedCityName, restaurantList, pageNo } = this.state;
        let currPage = pageNo;
        return (
            <React.Fragment>
                <div className="container-fluid no-padding filter-layout">
                    <div className="container">
                        <div className="heading">{mealType} Places in { selectedCityName}</div>
                        <div className="row">
                            <div className="leftSection col-xl-3 col-lg-4 col-md-5">
                                <div className="filterSection">
                                    <div className="filter-heading">Filters</div>
                                    <div className="filter-subheading">Select Location</div>
                                    <select className="filter-location" onChange={(e) => this.handleLocationChange(e)}>
                                        <option value='0'>Select location</option>
                                        {
                                            locations.map((item, index) => {
                                                return <option key={index} value={item.location_id}>{`${item.name}, ${item.city}`}</option>
                                            })
                                        }
                                    </select>
                                    <div className="filter-subheading">Cuisine</div>
                                    <div>
                                        <input type="checkbox" className="filter-cuisine" name="cuisine" value='1' onChange={(e) => this.handleCuisineChange(e, "1")} /><span className="filter-cuisine">North Indian</span>
                                    </div>
                                    <div>
                                        <input type="checkbox" className="filter-cuisine" name="cuisine" value='2' onChange={(e) => this.handleCuisineChange(e, "2")} /><span className="filter-cuisine">South Indian</span>
                                    </div>
                                    <div>
                                        <input type="checkbox" className="filter-cuisine" name="cuisine" value='3' onChange={(e) => this.handleCuisineChange(e, "3")} /><span className="filter-cuisine">Chinese</span>
                                    </div>
                                    <div>
                                        <input type="checkbox" className="filter-cuisine" name="cuisine" value='4' onChange={(e) => this.handleCuisineChange(e, "4")} /><span className="filter-cuisine">Fast Food</span>
                                    </div>
                                    <div>
                                        <input type="checkbox" className="filter-cuisine" name="cuisine" value='5' onChange={(e) => this.handleCuisineChange(e, "5")} /><span className="filter-cuisine">Street Food</span>
                                    </div>

                                    <div className="filter-subheading">Cost For Two</div>
                                    <input type="radio" className="filter-cuisine" name="cost" onChange={(e) => this.handleCostChange(e, 1, 500)} /> Less than &#8377; 500
                                    <br/>
                                    <input type="radio" className="filter-cuisine" name="cost" onChange={(e) => this.handleCostChange(e, 500, 1000)} /> &#8377; 500 to &#8377; 1000
                                    <br/>
                                    <input type="radio" className="filter-cuisine" name="cost" onChange={(e) => this.handleCostChange(e, 1000, 1500)} /> &#8377; 1000 to &#8377; 1500
                                    <br/>
                                    <input type="radio" className="filter-cuisine" name="cost" onChange={(e) => this.handleCostChange(e, 1500, 2000)} /> &#8377; 1500 to &#8377; 2000
                                    <br/>
                                    <input type="radio" className="filter-cuisine" name="cost" onChange={(e) => this.handleCostChange(e, 2000, 1000000)} /> &#8377; 2000+
                                    <br/>
                                    <input type="radio" className="filter-cuisine" name="cost" onChange={(e) => this.handleCostChange(e, 1, 1000000)} /> All

                                    <div className="filter-heading">Sort</div>
                                    <input type="radio" className="filter-cuisine" name="sort" onChange={(e) => this.handleSort(e, 1)} /> Price low to high
                                    <br/>
                                    <input type="radio" className="filter-cuisine" name="sort" onChange={(e) => this.handleSort(e, -1)} /> Price high to low
                                </div>
                            </div>
                            <div className="rightSection col-xl-9 col-lg-8 col-md-7">
                                <div className="resultSection">
                                    {
                                        restaurantList.length > 0
                                        ?
                                        restaurantList.map((item, index) => {
                                            return (
                                                <div key={index} className="result" onClick={() => this.goToRestaurant(item)}>
                                                    <div className="result-top row">
                                                        <div className="col-xl-2 col-lg-3 col-md-4">
                                                            <img src={require('../Assets/breakfast.png').default} className="result-image" alt="not found" />
                                                        </div>
                                                        <div className="col-xl-10 col-lg-9 col-md-8">
                                                            <div className="result-header">{item.name}</div>
                                                            <div className="result-subheader">{item.locality}</div>
                                                            <div className="result-address">{item.city}</div>
                                                        </div>
                                                    </div>
                                                    <hr />
                                                    <div className="result-bottom row">
                                                        <div className="col-xl-2 col-lg-3 col-md-4">
                                                            <div className="result-details">CUISINES:</div>
                                                            <div className="result-details">COST FOR TWO:</div>
                                                        </div>
                                                        <div className="col-xl-10 col-lg-9 col-md-8">
                                                            <div className="result-values">
                                                                {
                                                                    item.cuisine.map((c, i) => {
                                                                        return `${c.name}, `
                                                                    })
                                                                }
                                                            </div>
                                                            <div className="result-values">&#8377; { item.min_price }</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                        :
                                        <div className="text-danger text-center my-5">No Restaurants Found</div>
                                    }

                                    {
                                        restaurantList.length > 0
                                        ?
                                        <div className="mypagination">
                                            <div className="pagination-button" onClick={() => this.handlePageChange(--currPage)}>&#8592;</div>
                                            {
                                                this.getPages()
                                            }
                                            <div className="pagination-button" onClick={() => this.handlePageChange(++currPage)}>&#8594;</div>
                                        </div>
                                        :
                                        null
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

export default withRouter(Filter);
