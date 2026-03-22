import React from 'react';
import { useHistory } from 'react-router-dom';
import OrderSuccess from '../components/OrderSuccess';

const ThankYouPage = () => {
    const history = useHistory();

    return <OrderSuccess onClose={() => history.push('/shop')} />;
};

export default ThankYouPage;
