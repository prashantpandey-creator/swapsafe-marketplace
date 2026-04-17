from pydantic import BaseModel

class HaggleState(BaseModel):
    current_price: float
    min_price: float
    turn_count: int = 0

class HaggleService:
    @staticmethod
    def negotiate(user_offer: float, state: HaggleState) -> dict:
        state.turn_count += 1
        
        # 1. Immediate Acceptance
        if user_offer >= state.current_price:
            return {"status": "accepted", "price": user_offer, "message": "Deal! That works for me."}
            
        # 2. Hard Floor Rejection
        if user_offer < state.min_price:
            return {
                "status": "rejected", 
                "price": state.current_price, 
                "message": f"I can't go that low. The lowest I can do is around {state.current_price * 0.95:.2f}."
            }
            
        # 3. Counter Offer logic
        reduction = (state.current_price - state.min_price) * 0.2
        new_price = max(state.min_price, state.current_price - reduction)
        
        return {
            "status": "counter",
            "price": new_price,
            "message": f"That's a bit low. How about {new_price:.2f}?"
        }
