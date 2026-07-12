from apscheduler.schedulers.background import BackgroundScheduler
from services.recommendations.collaborative import _get_similarity_matrix

def warm_up_cache():
    print("Cron Job: მიმდინარეობს კეშის განახლება...")
    _get_similarity_matrix() 

def start_scheduler():
    scheduler = BackgroundScheduler()
    # ყოველ ღამე 04:00-ზე
    scheduler.add_job(warm_up_cache, 'cron', hour=4, minute=0)
    scheduler.start()
    return scheduler # ვაბრუნებთ ობიექტს, რომ lifespan-მა მართოს
