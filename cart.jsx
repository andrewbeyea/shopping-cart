// simulate getting products from DataBase
const products = [
  { name: "Apples", country: "Italy", cost: 3, instock: 10 },
  { name: "Oranges", country: "Spain", cost: 4, instock: 3 },
  { name: "Beans", country: "USA", cost: 2, instock: 5 },
  { name: "Cabbage", country: "USA", cost: 1, instock: 8 },
];
//=========Cart=============
const Cart = (props) => {
  const { Card, Accordion, Button } = ReactBootstrap;
  let data = props.location.data ? props.location.data : products;
  console.log(`data:${JSON.stringify(data)}`);

  return <Accordion defaultActiveKey="0">{list}</Accordion>;
};

const useDataApi = (initialUrl, initialData) => {
  const { useState, useEffect, useReducer } = React;
  const [url, setUrl] = useState(initialUrl);

  const [state, dispatch] = useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });
  console.log(`useDataApi called`);
  useEffect(() => {
    console.log("useEffect Called");
    let didCancel = false;
    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });
      try {
        const result = await axios(url);
        console.log("FETCH FROM URl");
        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result.data });
        }
      } catch (error) {
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();
    return () => {
      didCancel = true;
    };
  }, [url]);
  return [state, setUrl];
};
const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

const Products = (props) => {
  const [items, setItems] = React.useState(products);
  const [cart, setCart] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const {
    Card,
    Accordion,
    Button,
    Container,
    Row,
    Col,
    Image,
    Input,
  } = ReactBootstrap;

  //  Fetch Data
  const { Fragment, useState, useEffect, useReducer } = React;
  const [query, setQuery] = useState("http://localhost:1337/api/products");
  const [{ data, isLoading, isError }, doFetch] = useDataApi(query,{"data":[]});

  console.log(`Rendering Products ${JSON.stringify(data)}`);

  // add item to cart from inventory
  const addToCart = (e) => {
    let name = e.target.name;
    let item = items.filter((item) => item.name == name);
    console.log(`add to Cart ${JSON.stringify(item)}`);
    let productTable = [...items];
    let newProducts = [];
    for (let i = 0; i < productTable.length; i++){
      // confirm whether there are items in stock and then add to cart
      if(productTable[i].name == name && productTable[i].instock >0){
        productTable[i].instock --;
        setCart([...cart, ...item]);
      }
      newProducts.push(productTable[i]);
    }
    setItems(newProducts);
  };
// add item to inventory from cart
  const deleteCartItem = (index) => {
    //remove the item from the cart
    let productName = cart[index].name;
    let newCart = cart.filter((item, i) => index != i);
    setCart(newCart);
    // add a unit back into inventory when item is deleted from the cart
    let productTable = [...items];
    let newProducts = [];
    for (let i = 0; i < productTable.length; i++){
      // confirm whether there are items in stock and then add to cart
      if(productTable[i].name == productName ){
        productTable[i].instock ++;
      }
      newProducts.push(productTable[i]);
    }
    setItems(newProducts);
  };

  const photos = ["apple.png", "orange.png", "beans.png", "cabbage.png","nuts.png"];
// list of items in the inventory
  let list = items.map((item, index) => {
    return (
      <tr key={index}>
        <td><Image src={photos[index % 5]} width={70} roundedCircle></Image></td>
        <td>{item.name}</td>
        <td>{item.instock}</td>
        <td>${item.cost}</td>
        <td><input name={item.name} type="submit" onClick={addToCart}></input></td> 
      </tr>
    );
  });

//list of items in the cart
  let cartList = cart.map((item, index) => {
    return (
      <Accordion.Item key={1+index} eventKey={1 + index}>
      <Accordion.Header>
        {item.name}
      </Accordion.Header>
      <Accordion.Body onClick={() => deleteCartItem(index)}
        eventKey={1 + index}>
        $ {item.cost} from {item.country}
      </Accordion.Body>
    </Accordion.Item>
    );
  });

// list of items in the checkout
  let finalList = () => {
    let total = checkOut();
    let final = cart.map((item, index) => {
      return (
        <div key={index} index={index}>
          {item.name}: ${item.cost}
        </div>
      );
    });
    return { final, total };
  };

  const checkOut = () => {
    let costs = cart.map((item) => item.cost);
    const reducer = (accum, current) => accum + current;
    let newTotal = costs.reduce(reducer, 0);
    console.log(`total updated to ${newTotal}`);
    return newTotal;
  };
  // TODO: implement the restockProducts function
  function restockProducts(url) {
    doFetch(url);
    console.log(data.data[0].instock);
    let newItems = data.data.map((item) => {
      let {name, country, cost, instock} = item.attributes;
      return {name, country, cost, instock};
    });
    console.log("newItems:",newItems)
    setItems([...newItems]);
  };

  return (
    <Container>
      <Row>
        <Col>
          <h1>Product List</h1>
          <table className="tg-wrap">
            <thead>
              <tr>
                <th>Image</th>
                <th>Item Name</th>
                <th># In Stock</th>
                <th>Unit Price</th>
                <th>Buy It</th>
              </tr>
            </thead>
            <tbody>
              {list}
            </tbody>
          </table>
        </Col>
        <Col>
          <h1>Cart Contents</h1>
          <Accordion defaultActiveKey="0">{cartList}</Accordion>
        </Col>
        <Col>
          <h1>CheckOut </h1>
          <Button onClick={checkOut}>CheckOut $ {finalList().total}</Button>
          <div> {finalList().total > 0 && finalList().final} </div>
        </Col>
      </Row>
      <Row>
        <form
          onSubmit={(event) => {
            restockProducts(query);
            console.log(`Restock called on ${query}`);
            event.preventDefault();
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit">ReStock Products</button>
        </form>
      </Row>
    </Container>
  );
};
// ========================================
ReactDOM.render(<Products />, document.getElementById("root"));
