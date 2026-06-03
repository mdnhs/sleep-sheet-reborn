/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { client } from "@/lib/rpc";
import { CartItem, CartResponse } from "../type";

type CartState = {
  items: CartItem[];
  guestItems: CartItem[];
  shipping: number;
  status: "idle" | "loading" | "succeeded" | "failed";
};

const initialState: CartState = {
  items: [],
  guestItems: [],
  shipping: 0,
  status: "idle",
};

export const fetchCart = createAsyncThunk("cart/fetchCart", async () => {
  const res = await client.api.cart.$get();
  if (!res.ok) throw new Error("Failed to fetch cart");
  const data: CartResponse = await res.json();

  return data.items.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
    ...item.product,
    id: item.id
  }));
});


export const addToCart = createAsyncThunk(
    "cart/addToCart",
    async (
      payload: {
        productId: string;
        quantity: number;
        size?: string;
        color?: string;
        guestProduct?: CartItem;
      },
      { rejectWithValue, dispatch }
    ) => {
      try {
        const res = await client.api.auth.current.$get();
        const user = await res.json();

        if (!user || !user.data?.id) {
          if (payload.guestProduct) {
            dispatch(addGuestItem(payload.guestProduct));
            return "added";
          }
          return rejectWithValue("You must be logged in to add items to cart");
        }

        const { guestProduct: _, ...apiPayload } = payload;
        const postRes = await client.api.cart.$post({ json: apiPayload });
        if (!postRes.ok) {
          return rejectWithValue("Failed to add to cart");
        }

        await dispatch(fetchCart());
        return "added";
      } catch (error) {
        return rejectWithValue("Something went wrong while adding to cart");
      }
    }
  );

export const removeFromCart = createAsyncThunk(
  "cart/removeFromCart",
  async (cartItemId: string, { rejectWithValue, dispatch, getState }) => {
    try {
      const state = getState() as { cart: CartState };
      const isGuestItem = state.cart.guestItems.some(i => i.id === cartItemId);
      if (isGuestItem) {
        dispatch(removeGuestItem(cartItemId));
        return;
      }

      const res = await client.api.cart.$delete({ json: { cartItemId } });
      if (!res.ok) return rejectWithValue("Failed to remove from cart");

      await dispatch(fetchCart());
      return;
    } catch (error) {
      return rejectWithValue("Failed to remove from cart");
    }
  }
);

export const updateQuantity = createAsyncThunk(
  "cart/updateQuantity",
  async (
    payload: { id: string; quantity: number },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      const state = getState() as { cart: CartState };
      const isGuestItem = state.cart.guestItems.some(i => i.id === payload.id);
      if (isGuestItem) {
        dispatch(updateGuestItemQuantity(payload));
        return;
      }

      const res = await client.api.cart.$put({
        json: { cartItemId: payload.id, quantity: payload.quantity }
      });
      if (!res.ok) return rejectWithValue("Failed to update quantity");

      await dispatch(fetchCart());
      return;
    } catch (error) {
      return rejectWithValue("Failed to update quantity");
    }
  }
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCart: (state) => {
      state.items = [];
    },
    clearGuestCart: (state) => {
      state.guestItems = [];
    },
    setShipping: (state, action: PayloadAction<number>) => {
      state.shipping = action.payload;
    },
    addGuestItem: (state, action: PayloadAction<CartItem>) => {
      const existing = state.guestItems.find(
        i => i.productId === action.payload.productId &&
          i.size === action.payload.size &&
          i.color === action.payload.color
      );
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.guestItems.push(action.payload);
      }
    },
    removeGuestItem: (state, action: PayloadAction<string>) => {
      state.guestItems = state.guestItems.filter(i => i.id !== action.payload);
    },
    updateGuestItemQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.guestItems.find(i => i.id === action.payload.id);
      if (item) item.quantity = action.payload.quantity;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state) => {
        state.status = "failed";
      })
      .addCase(addToCart.fulfilled, () => {
        toast.success("Item added to cart");
      })
      .addCase(removeFromCart.fulfilled, () => {
        toast.success("Item removed from cart");
      })
      .addCase(updateQuantity.fulfilled, () => {
        toast.success("Quantity updated");
      })
      .addMatcher(
        action => action.type.endsWith('/rejected'),
        (state, action: PayloadAction<string>) => {
          toast.error(action.payload || "Operation failed");
        }
      );
  },
});

export const selectTotalItems = (state: { cart: CartState }) =>
  state.cart.items.reduce((total, item) => total + item.quantity, 0) +
  state.cart.guestItems.reduce((total, item) => total + item.quantity, 0);

export const { clearCart, clearGuestCart, setShipping, addGuestItem, removeGuestItem, updateGuestItemQuantity } = cartSlice.actions;
export default cartSlice.reducer;
