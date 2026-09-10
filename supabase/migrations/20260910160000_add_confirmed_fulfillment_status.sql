-- Keep fulfillment distinct from payment; confirmed is the explicit post-payment acknowledgement state.
alter type public.fulfillment_status add value if not exists 'confirmed' after 'unfulfilled';
