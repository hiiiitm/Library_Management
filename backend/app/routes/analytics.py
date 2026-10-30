from fastapi import APIRouter
from backend.app.services import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Aggregations"])

@router.get("/dashboard-kpi")
def dashboard_kpis():
    return analytics_service.get_dashboard_kpis()

@router.get("/pipeline-1-genres")
def pipeline_genres():
    return analytics_service.pipeline_1_genre_distribution()

@router.get("/pipeline-2-trends")
def pipeline_trends():
    return analytics_service.pipeline_2_monthly_loan_trends()

@router.get("/pipeline-3-buckets")
def pipeline_buckets():
    return analytics_service.pipeline_3_book_page_buckets()

@router.get("/pipeline-4-publishers")
def pipeline_publishers():
    return analytics_service.pipeline_4_publisher_market_share()

@router.get("/pipeline-5-fines")
def pipeline_fines():
    return analytics_service.pipeline_5_overdue_fines_by_status()

@router.get("/pipeline-6-facet")
def pipeline_facet():
    return analytics_service.pipeline_6_multi_faceted_inventory()
